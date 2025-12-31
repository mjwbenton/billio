import axios from "axios";
import { createHash } from "crypto";
import { S3 } from "aws-sdk";
import Jimp, { MIME_JPEG } from "jimp";
import { Image } from "../generated/graphql";

const BUCKET = process.env.BILLIO_IMAGE_BUCKET!;
const HASH_FUNCTION = "md5";
const ENCODING = "hex";
const MIME_TYPE = "image/jpeg";

const ORIGINAL_ENDING = "_o.jpg";
const STANDARD_V1_ENDING = "_s_v1.jpg";
const STANDARD_V1_WIDTH = 128;
const STANDARD_V1_QUALITY = 80;
const STANDARD_V1_SIZE = "StandardV1";

type ImageSize = typeof STANDARD_V1_SIZE;
export type ImageData = Image & { sizes?: Array<Image & { size: ImageSize }> };

const s3 = new S3();

export async function storeImage({
  imageUrl,
}: {
  imageUrl: string;
}): Promise<ImageData> {
  const { data } = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });
  const [originalImage, resizedImage] = await Promise.all([
    uploadOriginal(data),
    uploadResized(data),
  ]);
  return {
    ...originalImage,
    sizes: resizedImage ? [resizedImage] : [],
  };
}

async function uploadOriginal(data: Buffer): Promise<Image> {
  const jimpImage = await Jimp.read(data);
  const imageData = await jimpImage.quality(90).getBufferAsync(MIME_JPEG);
  const key = createKey(imageData, ORIGINAL_ENDING);

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

async function uploadResized(
  data: Buffer,
): Promise<(Image & { size: ImageSize }) | null> {
  const jimpImage = await Jimp.read(data);

  // Only resize if larger than standard width
  if (jimpImage.getWidth() <= STANDARD_V1_WIDTH) {
    return null;
  }

  const resizedImage = jimpImage
    .resize(STANDARD_V1_WIDTH, Jimp.AUTO)
    .quality(STANDARD_V1_QUALITY);
  const resizedData = await resizedImage.getBufferAsync(MIME_JPEG);
  const key = createKey(resizedData, STANDARD_V1_ENDING);

  await s3
    .upload({
      Bucket: BUCKET,
      Key: key,
      Body: resizedData,
      ContentType: MIME_TYPE,
    })
    .promise();

  return {
    size: STANDARD_V1_SIZE,
    url: key,
    width: resizedImage.getWidth(),
    height: resizedImage.getHeight(),
  };
}

export function selectImage(
  imageData: ImageData | undefined,
): Image | undefined {
  return (
    imageData?.sizes?.find(({ size }) => size === STANDARD_V1_SIZE) ?? imageData
  );
}

function createKey(data: Buffer, ending: string) {
  return `${createHash(HASH_FUNCTION).update(data).digest(ENCODING)}${ending}`;
}
