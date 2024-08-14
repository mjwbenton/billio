import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import path from "path";
import DomainConstruct from "./DomainConstruct";

const ADMIN_DOMAIN_NAME = "admin.billio.mattb.tech";

const BUILD_PATH = path.join(__dirname, "../../admin/build");

export default class BillioAdminStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const websiteBucket = new Bucket(this, "WebsiteBucket", {
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
    });

    const domain = new DomainConstruct(this, "Domain", {
      domainName: ADMIN_DOMAIN_NAME,
    });

    const distribution = new Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new S3Origin(websiteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: [domain.name],
      certificate: domain.certificate,
    });

    domain.pointAt(new CloudFrontTarget(distribution));

    new BucketDeployment(this, "Deployment", {
      destinationBucket: websiteBucket,
      sources: [Source.asset(BUILD_PATH)],
      distribution,
    });
  }
}
