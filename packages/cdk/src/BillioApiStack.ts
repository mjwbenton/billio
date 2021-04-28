import { App, Stack } from "@aws-cdk/core";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { Runtime, IFunction } from "@aws-cdk/aws-lambda";
import {
  HttpApi,
  HttpRoute,
  PayloadFormatVersion,
  CorsHttpMethod,
  HttpRouteKey,
  HttpMethod,
  CfnRoute,
} from "@aws-cdk/aws-apigatewayv2";
import { IIdentity, PolicyStatement, Effect } from "@aws-cdk/aws-iam";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import path from "path";
import BillioDataStack from "./BillioDataStack";
import DomainConstruct from "./DomainConstruct";

export default class BillioApiStack extends Stack {
  private readonly api: HttpApi;

  constructor(
    app: App,
    id: string,
    {
      dataStack,
      enableMutations,
      enableIam,
      domainName,
    }: {
      dataStack: BillioDataStack;
      enableMutations: boolean;
      enableIam: boolean;
      domainName: string;
    }
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
      environment: {
        BILLIO_TABLE: dataStack.itemTable.tableName,
        ENABLE_MUTATIONS: enableMutations ? "1" : "0",
      },
    });
    enableMutations
      ? dataStack.itemTable.grantReadWriteData(lambdaFunction)
      : dataStack.itemTable.grantReadData(lambdaFunction);

    const domainNameConstruct = new DomainConstruct(this, "Domain", {
      domainName,
    }).apiDomainName();

    this.api = new HttpApi(this, "BillioGraphQl", {
      corsPreflight: {
        allowCredentials: false,
        allowOrigins: [
          "http://localhost:3000",
          "https://admin.billio.mattb.tech",
        ],
        allowMethods: [CorsHttpMethod.ANY],
        allowHeaders: [
          "authorization",
          "content-type",
          "x-amz-date",
          "x-amz-security-token",
        ],
      },
      disableExecuteApiEndpoint: true,
      defaultDomainMapping: {
        domainName: domainNameConstruct,
      },
    });

    const graphqlRoute = new HttpRoute(this, "Route", {
      httpApi: this.api,
      integration: new LambdaProxyIntegration({
        handler: lambdaFunction,
        payloadFormatVersion: PayloadFormatVersion.VERSION_1_0,
      }),
      routeKey: HttpRouteKey.with("/", HttpMethod.POST),
    });
    if (enableIam) {
      (graphqlRoute.node.defaultChild as CfnRoute).authorizationType =
        "AWS_IAM";
    }
  }

  public grantCall(to: IIdentity) {
    to.addToPrincipalPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["execute-api:Invoke"],
        resources: [
          `arn:aws:execute-api:${this.region}:${this.account}:${this.api.httpApiId}/*/*/*`,
        ],
      })
    );
  }
}
