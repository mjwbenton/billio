import { App, Stack } from "@aws-cdk/core";
import {
  UserPool,
  UserPoolClient,
  CfnIdentityPool,
  AccountRecovery,
} from "@aws-cdk/aws-cognito";

export default class BillioAuthStack extends Stack {
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

    new CfnIdentityPool(this, "IdentityPool", {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });
  }
}
