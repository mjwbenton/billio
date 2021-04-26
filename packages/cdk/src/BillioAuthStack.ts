import { App, Stack } from "@aws-cdk/core";
import {
  UserPool,
  UserPoolClient,
  CfnIdentityPool,
  AccountRecovery,
  CfnIdentityPoolRoleAttachment,
} from "@aws-cdk/aws-cognito";
import { Role, IRole, FederatedPrincipal } from "@aws-cdk/aws-iam";

export default class BillioAuthStack extends Stack {
  public readonly role: IRole;

  constructor(app: App, id: string) {
    super(app, id);

    const userPool = new UserPool(this, "Pool", {
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
      accountRecovery: AccountRecovery.NONE,
    });

    const userPoolClient = new UserPoolClient(this, "Client", {
      userPool,
      generateSecret: false,
    });

    const identityPool = new CfnIdentityPool(this, "IdentityPool", {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    this.role = new Role(this, "AuthenticatedRole", {
      assumedBy: new FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });

    new CfnIdentityPoolRoleAttachment(this, "IdentityPoolRoleAttachment", {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: this.role.roleArn,
      },
      roleMappings: {
        mapping: {
          type: "Token",
          identityProvider: `cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}:${userPoolClient.userPoolClientId}`,
          ambiguousRoleResolution: "AuthenticatedRole",
        },
      },
    });
  }
}
