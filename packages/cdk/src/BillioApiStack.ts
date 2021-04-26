import { App, Stack, Duration, CfnTrafficRoute } from "@aws-cdk/core";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { Runtime } from "@aws-cdk/aws-lambda";
import {
  HttpApi,
  HttpRoute,
  PayloadFormatVersion,
  CorsHttpMethod,
  HttpRouteKey,
  CfnRoute,
} from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import path from "path";
import BillioDataStack from "./BillioDataStack";
import DomainConstruct from "./DomainConstruct";

export const API_DOMAIN_NAME = "api.billio.mattb.tech";

export default class BillioApiStack extends Stack {
  constructor(
    app: App,
    id: string,
    { dataStack }: { dataStack: BillioDataStack }
  ) {
    super(app, id);

    const lambdaFunction = new NodejsFunction(this, "LambdaFunction", {
      entry: path.join(__dirname, "../../graphql/dist/index.js"),
      handler: "handler",
      bundling: {
        target: "es2020",
        environment: {
          NODE_ENV: "production",
        },
      },
      runtime: Runtime.NODEJS_14_X,
      memorySize: 1024,
    });
    dataStack.itemTable.grantReadWriteData(lambdaFunction);

    const domainName = new DomainConstruct(this, "Domain", {
      domainName: API_DOMAIN_NAME,
    }).apiDomainName();

    const api = new HttpApi(this, "BillioGraphQl", {
      corsPreflight: {
        allowCredentials: false,
        allowOrigins: ["*"],
        allowMethods: [CorsHttpMethod.ANY],
        allowHeaders: ["Content-Type"],
      },
      disableExecuteApiEndpoint: true,
      defaultDomainMapping: {
        domainName,
      },
    });

    const graphqlRoute = new HttpRoute(this, "Route", {
      httpApi: api,
      integration: new LambdaProxyIntegration({
        handler: lambdaFunction,
        payloadFormatVersion: PayloadFormatVersion.VERSION_1_0,
      }),
      routeKey: HttpRouteKey.DEFAULT,
    });
    (graphqlRoute.node.defaultChild as CfnRoute).authorizationType = "AWS_IAM";
  }
}
