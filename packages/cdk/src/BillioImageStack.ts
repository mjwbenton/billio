import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, IBucket } from "aws-cdk-lib/aws-s3";

export default class BillioImageStack extends Stack {
  public readonly imageBucket: IBucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.imageBucket = new Bucket(this, "ImageBucket");
  }
}
