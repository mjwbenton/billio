import { Stack, Duration, Construct } from "@aws-cdk/core";
import {
  RecordTarget,
  IAliasRecordTarget,
  ARecord,
  HostedZone,
  IHostedZone,
} from "@aws-cdk/aws-route53";
import {
  Certificate,
  CertificateValidation,
  ICertificate,
} from "@aws-cdk/aws-certificatemanager";

const HOSTED_ZONE = "mattb.tech";
const HOSTED_ZONE_ID = "Z2GPSB1CDK86DH";

export default class DomainConstruct extends Construct {
  public readonly domainName: string;
  private readonly hostedZone: IHostedZone;

  constructor(
    scope: Construct,
    id: string,
    { domainName }: { domainName: string }
  ) {
    super(scope, id);
    this.domainName = domainName;
    this.hostedZone = HostedZone.fromHostedZoneAttributes(scope, `HostedZone`, {
      hostedZoneId: HOSTED_ZONE_ID,
      zoneName: HOSTED_ZONE,
    });
  }

  public pointAt(target: IAliasRecordTarget): ARecord {
    return new ARecord(this, `ARecord`, {
      zone: this.hostedZone,
      ttl: Duration.minutes(5),
      recordName: this.domainName,
      target: RecordTarget.fromAlias(target),
    });
  }

  public createCertificate(): ICertificate {
    return new Certificate(this, "Certificate", {
      domainName: this.domainName,
      validation: CertificateValidation.fromDns(this.hostedZone),
    });
  }
}
