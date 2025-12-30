import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import BillioDataStack from "./BillioDataStack";

interface BillioDataMigrationStackProps {
  dataStacks: BillioDataStack[];
}

export default class BillioDataMigrationStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: BillioDataMigrationStackProps,
  ) {
    super(scope, id);

    const githubProviderArn = `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`;
    const githubProvider =
      iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
        this,
        "GitHubOIDC",
        githubProviderArn,
      );

    const migrationRole = new iam.Role(this, "GitHubMigrationRole", {
      roleName: "billio-github-actions-dsql-migrate",
      assumedBy: new iam.WebIdentityPrincipal(
        githubProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub":
              "repo:mjwbenton/billio:*",
          },
        },
      ),
    });

    migrationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["dsql:DbConnectAdmin"],
        resources: props.dataStacks.map(
          (stack) => stack.dsqlCluster.attrResourceArn,
        ),
      }),
    );

    migrationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["cloudformation:DescribeStacks"],
        resources: props.dataStacks.map(
          (stack) =>
            `arn:aws:cloudformation:${stack.region}:${stack.account}:stack/${stack.stackName}/*`,
        ),
      }),
    );
  }
}
