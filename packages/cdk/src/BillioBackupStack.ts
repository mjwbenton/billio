import { Stack, Construct } from "@aws-cdk/core";
import { Bucket } from "@aws-cdk/aws-s3";
import { Rule, Schedule } from "@aws-cdk/aws-events";
import { LambdaFunction } from "@aws-cdk/aws-events-targets";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { Runtime } from "@aws-cdk/aws-lambda";
import path from "path";
import BillioDataStack from "./BillioDataStack";
import {
  Alarm,
  ComparisonOperator,
  TreatMissingData,
} from "@aws-cdk/aws-cloudwatch";
import { SnsAction } from "@aws-cdk/aws-cloudwatch-actions";
import { Topic } from "@aws-cdk/aws-sns";

const ALARM_TOPIC = "arn:aws:sns:us-east-1:858777967843:general-alarms";

export default class BillioBackupStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    { dataStack }: { dataStack: BillioDataStack }
  ) {
    super(scope, id);
    const backupBucket = new Bucket(this, "BackupBucket");

    const lambdaFunction = new NodejsFunction(this, "LambdaFunction", {
      entry: path.join(__dirname, "../../bulk-export/dist/lambda.js"),
      handler: "handler",
      bundling: {
        target: "es2020",
        environment: {
          NODE_ENV: "production",
        },
      },
      runtime: Runtime.NODEJS_14_X,
      memorySize: 3008,
      environment: {
        BILLIO_TABLE: dataStack.itemTable.tableName,
        BILLIO_BACKUP_BUCKET: backupBucket.bucketName,
      },
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
      new SnsAction(Topic.fromTopicArn(this, "AlarmTopic", ALARM_TOPIC))
    );
  }
}
