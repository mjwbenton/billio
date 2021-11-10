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
    itemTable.addGlobalSecondaryIndex({
      indexName: "shelf",
      partitionKey: { name: "type:shelf", type: AttributeType.STRING },
      sortKey: { name: "movedAt:type:id", type: AttributeType.STRING },
    });
    itemTable.addGlobalSecondaryIndex({
      indexName: "externalId",
      partitionKey: { name: "externalId", type: AttributeType.STRING },
      sortKey: { name: "movedAt:type:id", type: AttributeType.STRING },
    });
    // Specifically for TV
    itemTable.addGlobalSecondaryIndex({
      indexName: "seriesId",
      partitionKey: { name: "seriesId", type: AttributeType.STRING },
      sortKey: { name: "seasonNumber", type: AttributeType.NUMBER },
    });

    this.itemTable = itemTable;
  }
}
