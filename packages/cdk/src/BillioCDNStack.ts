import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Distribution,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import DomainConstruct from "./DomainConstruct";
import BillioImageStack from "./BillioImageStack";

export default class BillioCDNStack extends Stack {
  public readonly domainName: string;
  public readonly endpoint: string;

  constructor(
    scope: Construct,
    id: string,
    {
      imageStack,
      domainName,
    }: { imageStack: BillioImageStack; domainName: string },
  ) {
    super(scope, id);
    this.domainName = domainName;
    this.endpoint = `https://${domainName}`;

    const domain = new DomainConstruct(this, "Domain", {
      domainName,
    });

    const distribution = new Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new S3Origin(imageStack.imageBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: new ResponseHeadersPolicy(
          this,
          "ResponseHeadersPolicy",
          {
            customHeadersBehavior: {
              customHeaders: [
                {
                  header: "Cache-Control",
                  value: "max-age=31536000",
                  override: true,
                },
              ],
            },
          },
        ),
      },
      domainNames: [domain.name],
      certificate: domain.certificate,
    });

    domain.pointAt(new CloudFrontTarget(distribution));
  }
}
