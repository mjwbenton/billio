import { Stack, Duration, Construct } from "@aws-cdk/core";
import {
  RecordTarget,
  IAliasRecordTarget,
  ARecord,
  HostedZone,
  IHostedZone,
} from "@aws-cdk/aws-route53";
import { ApiGatewayv2DomainProperties } from "@aws-cdk/aws-route53-targets";
import {
  Certificate,
  CertificateValidation,
  ICertificate,
} from "@aws-cdk/aws-certificatemanager";
import { DomainName } from "@aws-cdk/aws-apigatewayv2";

const HOSTED_ZONE = "mattb.tech";
const HOSTED_ZONE_ID = "Z2GPSB1CDK86DH";

export default class DomainConstruct extends Construct {
  public readonly domainName: string;
  public readonly certificate: ICertificate;
  private readonly hostedZone: IHostedZone;

  constructor(
    scope: Construct,
    id: string,
    { domainName }: { domainName: string }
  ) {
    super(scope, id);
    this.domainName = domainName;
    this.hostedZone = HostedZone.fromHostedZoneAttributes(scope, "HostedZone", {
      hostedZoneId: HOSTED_ZONE_ID,
      zoneName: HOSTED_ZONE,
    });
    this.certificate = new Certificate(this, "Certificate", {
      domainName: this.domainName,
      validation: CertificateValidation.fromDns(this.hostedZone),
    });
  }

  public apiDomainName() {
    const apiDomainName = new DomainName(this, "APIDomainName", {
      domainName: this.domainName,
      certificate: this.certificate,
    });
    this.pointAt(
      new ApiGatewayv2DomainProperties(
        apiDomainName.regionalDomainName,
        apiDomainName.regionalHostedZoneId
      )
    );
    return apiDomainName;
  }

  public pointAt(target: IAliasRecordTarget): ARecord {
    return new ARecord(this, `ARecord`, {
      zone: this.hostedZone,
      ttl: Duration.minutes(5),
      recordName: this.domainName,
      target: RecordTarget.fromAlias(target),
    });
  }
}
