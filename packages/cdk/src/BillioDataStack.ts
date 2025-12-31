import { CfnOutput, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dsql from "aws-cdk-lib/aws-dsql";

export default class BillioDataStack extends Stack {
  public readonly dsqlCluster: dsql.CfnCluster;
  public readonly dsqlEndpoint: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.dsqlCluster = new dsql.CfnCluster(this, "DsqlCluster", {
      deletionProtectionEnabled: true,
    });

    this.dsqlEndpoint = `${this.dsqlCluster.attrIdentifier}.dsql.${this.region}.on.aws`;

    new CfnOutput(this, "DsqlEndpoint", {
      value: this.dsqlEndpoint,
    });
  }
}
