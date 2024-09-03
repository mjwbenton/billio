import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import path from "path";
import BillioDataStack from "./BillioDataStack";
import {
  Alarm,
  ComparisonOperator,
  TreatMissingData,
} from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Topic } from "aws-cdk-lib/aws-sns";

const ALARM_TOPIC = "arn:aws:sns:us-east-1:858777967843:general-alarms";

export default class BillioBackupStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    { dataStack }: { dataStack: BillioDataStack },
  ) {
    super(scope, id);
    const backupBucket = new Bucket(this, "BackupBucket", {
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const lambdaFunction = new NodejsFunction(this, "LambdaFunction", {
      entry: path.join(__dirname, "../../backup/dist/lambda.js"),
      handler: "handler",
      bundling: {
        target: "es2020",
        environment: {
          NODE_ENV: "production",
        },
      },
      runtime: Runtime.NODEJS_20_X,
      memorySize: 3008,
      timeout: Duration.minutes(1),
      environment: {
        BILLIO_TABLE: dataStack.itemTable.tableName,
        BILLIO_BACKUP_BUCKET: backupBucket.bucketName,
      },
      architecture: Architecture.ARM_64,
    });

    backupBucket.grantWrite(lambdaFunction);
    dataStack.itemTable.grantReadData(lambdaFunction);

    new Rule(this, "Rule", {
      schedule: Schedule.cron({
        year: "*",
        month: "*",
        day: "1",
        hour: "1",
        minute: "1",
      }),
      targets: [new LambdaFunction(lambdaFunction)],
    });

    new Alarm(this, "FailureAlarm", {
      metric: lambdaFunction.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    }).addAlarmAction(
      new SnsAction(Topic.fromTopicArn(this, "AlarmTopic", ALARM_TOPIC)),
    );
  }
}
