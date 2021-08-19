import { Stack, Construct } from "@aws-cdk/core";
import { Bucket, IBucket } from "@aws-cdk/aws-s3";

export default class BillioImageStack extends Stack {
  public readonly imageBucket: IBucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.imageBucket = new Bucket(this, "ImageBucket");
  }
}
