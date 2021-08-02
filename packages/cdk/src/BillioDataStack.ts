import { Stack, StackProps, Construct } from "@aws-cdk/core";
import {
  AttributeType,
  BillingMode,
  ITable,
  Table,
} from "@aws-cdk/aws-dynamodb";

export default class BillioDataStack extends Stack {
  public readonly itemTable: ITable;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const itemTable = new Table(this, "ItemTable", {
      partitionKey: { name: "type:id", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });
    itemTable.addGlobalSecondaryIndex({
      indexName: "type",
      partitionKey: { name: "type", type: AttributeType.STRING },
      sortKey: { name: "movedAt:type:id", type: AttributeType.STRING },
    });

    this.itemTable = itemTable;
  }
}
