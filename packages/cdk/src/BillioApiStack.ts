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
import BillioImageStack from "./BillioImageStack";
import BillioCDNStack from "./BillioCDNStack";

export default class BillioApiStack extends Stack {
  private readonly api: HttpApi;

  constructor(
    app: App,
    id: string,
    {
      dataStack,
      imageStack,
      cdnStack,
      enableMutations,
      enableIam,
      domainName,
    }: {
      dataStack: BillioDataStack;
      imageStack: BillioImageStack;
      cdnStack: BillioCDNStack;
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
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (inputDir: string, outputDir: string): string[] => {
            return [`cp ${inputDir}/packages/graphql/.env ${outputDir}`];
          },
        },
      },
      runtime: Runtime.NODEJS_14_X,
      memorySize: 1024,
      environment: {
        BILLIO_TABLE: dataStack.itemTable.tableName,
        BILLIO_IMAGE_BUCKET: imageStack.imageBucket.bucketName,
        BILLIO_IMAGE_DOMAIN: cdnStack.endpoint,
        ENABLE_MUTATIONS: enableMutations ? "1" : "0",
      },
    });

    if (enableMutations) {
      dataStack.itemTable.grantReadWriteData(lambdaFunction);
      imageStack.imageBucket.grantReadWrite(lambdaFunction);
    } else {
      dataStack.itemTable.grantReadData(lambdaFunction);
    }

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
