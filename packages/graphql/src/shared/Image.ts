import axios from "axios";
import { createHash } from "crypto";
import { S3 } from "aws-sdk";
import Jimp, { MIME_JPEG } from "jimp";
import { Image } from "../generated/graphql";

const BUCKET = process.env.BILLIO_IMAGE_BUCKET!;
const HASH_FUNCTION = "md5";
const ENCODING = "hex";
const MIME_TYPE = "image/jpeg";

const STANDARD_WIDTH = 128;
const STANDARD_QUALITY = 80;
const FILE_ENDING = ".jpg";

const s3 = new S3();

export async function storeImage({
  imageUrl,
}: {
  imageUrl: string;
}): Promise<Image> {
  const { data } = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });
  return uploadImage(data);
}

async function uploadImage(data: Buffer): Promise<Image> {
  const jimpImage = await Jimp.read(data);

  // Resize if larger than standard width
  const needsResize = jimpImage.getWidth() > STANDARD_WIDTH;
  if (needsResize) {
    jimpImage.resize(STANDARD_WIDTH, Jimp.AUTO).quality(STANDARD_QUALITY);
  }

  const imageData = await jimpImage.getBufferAsync(MIME_JPEG);
  const key = createKey(imageData, FILE_ENDING);

  await s3
    .upload({
      Bucket: BUCKET,
      Key: key,
      Body: imageData,
      ContentType: MIME_TYPE,
    })
    .promise();

  return {
    url: key,
    width: jimpImage.getWidth(),
    height: jimpImage.getHeight(),
  };
}

export function selectImage(imageData: Image | undefined): Image | undefined {
  return imageData;
}

function createKey(data: Buffer, ending: string) {
  return `${createHash(HASH_FUNCTION).update(data).digest(ENCODING)}${ending}`;
}
