import axios from "axios";
import { createHash } from "crypto";
import { S3 } from "aws-sdk";
import Jimp from "jimp";

const BUCKET = process.env.BILLIO_IMAGE_BUCKET!;
const HASH_FUNCTION = "md5";
const ENCODING = "hex";
const ENDING = "_o.jpg";
const MIME_TYPE = "image/jpeg";

const s3 = new S3();

export default async function storeImage({ imageUrl }: { imageUrl: string }) {
  const { data } = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });
  const filename = `${createHash(HASH_FUNCTION)
    .update(data)
    .digest(ENCODING)}${ENDING}`;
  const [jimpImage] = await Promise.all([
    Jimp.read(data),
    s3
      .upload({
        Bucket: BUCKET,
        Key: filename,
        Body: data,
        ContentType: MIME_TYPE,
      })
      .promise(),
  ]);
  return {
    url: filename,
    width: jimpImage.getWidth(),
    height: jimpImage.getHeight(),
  };
}
