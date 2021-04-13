import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";

dynamoose.model.defaults.set({
  create: false,
  update: false,
  waitForActive: false,
});

const TABLE_NAME =
  process.env.BILLIO_TABLE ?? "BillioData-ItemTable276B2AC8-1HIYN64N2BKA1";

export enum ItemType {
  Book = "book",
  VideoGame = "videogame",
}

export class ItemDocument extends Document {
  type: ItemType;
  id: string;
  shelf: string;
  title: string;
  updatedAt: Date;
}

const Item = dynamoose.model<ItemDocument>(
  TABLE_NAME,
  new dynamoose.Schema(
    {
      id: String,
      type: {
        type: String,
        index: {
          name: "type",
          rangeKey: "updatedAt:type:id",
        },
      },
      shelf: String,
      title: String,
      "type:id": {
        type: {
          value: "Combine",
          settings: { attributes: ["type", "id"], seperator: ":" },
        },
        hashKey: true,
      },
      "updatedAt:type:id": {
        type: {
          value: "Combine",
          settings: { attributes: ["updatedAt", "type", "id"], seperator: ":" },
        },
      },
      "type:shelf": {
        type: {
          value: "Combine",
          settings: { attributes: ["type", "shelf"], seperator: ":" },
        },
        index: {
          name: "shelf",
          rangeKey: "updatedAt:type:id",
        },
      },
    },
    {
      saveUnknown: false,
      timestamps: true,
    }
  )
);

export default Item;

type QueryResponseMeta = {
  count: number;
  lastKey?: string;
};

export const Query = {
  withId: (type: ItemType, id: string) =>
    Item.get({ "type:id": `${type}:${id}` }),
  ofType: (type: ItemType): Promise<Array<ItemDocument> & QueryResponseMeta> =>
    Item.query("type").eq("videogame").using("type").exec(),
  onShelf: (
    type: ItemType,
    shelf: string
  ): Promise<Array<ItemDocument> & QueryResponseMeta> =>
    Item.query("type:shelf").eq(`${type}:${shelf}`).using("shelf").exec(),
};
