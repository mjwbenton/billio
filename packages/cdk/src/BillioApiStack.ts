import { App, Stack, Duration } from "@aws-cdk/core";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { Runtime } from "@aws-cdk/aws-lambda";
import {
  HttpApi,
  PayloadFormatVersion,
  CorsHttpMethod,
} from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import {
  CloudFrontWebDistribution,
  CloudFrontAllowedMethods,
  CloudFrontAllowedCachedMethods,
  OriginProtocolPolicy,
  ViewerCertificate,
  ViewerProtocolPolicy,
} from "@aws-cdk/aws-cloudfront";
import path from "path";
import BillioDataStack from "./BillioDataStack";
import DomainConstruct from "./DomainConstruct";
import { CloudFrontTarget } from "@aws-cdk/aws-route53-targets";

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

    const api = new HttpApi(this, "Api", {
      apiName: "BillioApi",
      defaultIntegration: new LambdaProxyIntegration({
        handler: lambdaFunction,
        payloadFormatVersion: PayloadFormatVersion.VERSION_1_0,
      }),
      corsPreflight: {
        allowCredentials: false,
        allowOrigins: ["*"],
        allowMethods: [CorsHttpMethod.ANY],
        allowHeaders: ["Content-Type"],
      },
    });

    const domain = new DomainConstruct(this, "Domain", {
      domainName: API_DOMAIN_NAME,
    });

    const certificate = domain.createCertificate();

    const distribution = new CloudFrontWebDistribution(this, "Distribution", {
      originConfigs: [
        {
          behaviors: [
            {
              isDefaultBehavior: true,
              defaultTtl: Duration.minutes(5),
              compress: true,
              allowedMethods: CloudFrontAllowedMethods.ALL,
              forwardedValues: {
                queryString: true,
                headers: ["Accept", "Origin"],
              },
              cachedMethods: CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
            },
          ],
          customOriginSource: {
            domainName: `${api.apiId}.execute-api.${this.region}.amazonaws.com`,
            httpsPort: 443,
            originProtocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
          },
        },
      ],
      viewerCertificate: ViewerCertificate.fromAcmCertificate(certificate, {
        aliases: [API_DOMAIN_NAME],
      }),
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });

    domain.pointAt(new CloudFrontTarget(distribution));
  }
}
