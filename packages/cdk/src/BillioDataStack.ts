import { Stack, StackProps, Construct } from "@aws-cdk/core";
import {
  AttributeType,
  BillingMode,
  ITable,
  Table,
} from "@aws-cdk/aws-dynamodb";

export default class BillioDataStack extends Stack {
  public readonly itemTable: ITable;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const itemTable = new Table(this, "ItemTable", {
      partitionKey: { name: "type:id", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    itemTable.addGlobalSecondaryIndex({
      indexName: "type",
      partitionKey: { name: "type", type: AttributeType.STRING },
      sortKey: { name: "updatedAt:type:id", type: AttributeType.STRING },
    });
    itemTable.addGlobalSecondaryIndex({
      indexName: "shelf",
      partitionKey: { name: "type:shelf", type: AttributeType.STRING },
      sortKey: { name: "updatedAt:type:id", type: AttributeType.STRING },
    });

    this.itemTable = itemTable;
  }
}
