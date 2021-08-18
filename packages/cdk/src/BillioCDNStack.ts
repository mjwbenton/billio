import { Stack, Construct } from "@aws-cdk/core";
import { Distribution, ViewerProtocolPolicy } from "@aws-cdk/aws-cloudfront";
import { S3Origin } from "@aws-cdk/aws-cloudfront-origins";
import { CloudFrontTarget } from "@aws-cdk/aws-route53-targets";
import DomainConstruct from "./DomainConstruct";
import BillioImageStack from "./BillioImageStack";

export default class BillioCDNStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    {
      imageStack,
      domainName,
    }: { imageStack: BillioImageStack; domainName: string }
  ) {
    super(scope, id);

    const domain = new DomainConstruct(this, "Domain", {
      domainName,
    });

    const distribution = new Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new S3Origin(imageStack.imageBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: [domain.name],
      certificate: domain.certificate,
    });

    domain.pointAt(new CloudFrontTarget(distribution));
  }
}
