import { App, Duration, Stack } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  HttpApi,
  HttpRoute,
  PayloadFormatVersion,
  CorsHttpMethod,
  HttpRouteKey,
  HttpMethod,
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { CfnRoute } from "aws-cdk-lib/aws-apigatewayv2";
import { IIdentity, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
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
    },
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
      runtime: Runtime.NODEJS_24_X,
      memorySize: 2048,
      timeout: Duration.seconds(10),
      environment: {
        BILLIO_DSQL_ENDPOINT: dataStack.dsqlEndpoint,
        BILLIO_IMAGE_BUCKET: imageStack.imageBucket.bucketName,
        BILLIO_IMAGE_DOMAIN: cdnStack.endpoint,
        ENABLE_MUTATIONS: enableMutations ? "1" : "0",
      },
      architecture: Architecture.ARM_64,
    });

    if (enableMutations) {
      imageStack.imageBucket.grantReadWrite(lambdaFunction);
    }

    lambdaFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["dsql:DbConnectAdmin"],
        resources: [dataStack.dsqlCluster.attrResourceArn],
      }),
    );

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
      integration: new HttpLambdaIntegration("Integration", lambdaFunction, {
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
      }),
    );
  }
}
