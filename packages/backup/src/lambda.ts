import { S3 } from "aws-sdk";
import { fetchAllForType } from ".";
import { TYPES } from "@mattb.tech/billio-config";

const BUCKET = process.env.BILLIO_BACKUP_BUCKET!;
const s3 = new S3();

export const handler = async () => {
  const date = new Date().toISOString();
  await Promise.all(
    TYPES.map(async (type) => {
      const result = await fetchAllForType(type);
      await s3
        .upload({
          Bucket: BUCKET,
          Key: `${type}-${date}.json`,
          Body: JSON.stringify(result, null, 2),
        })
        .promise();
    }),
  );
};
