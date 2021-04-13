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
  lastKey?: string;
};

export const Query = {
  withId: (type: ItemType, id: string) =>
    Item.get({ "type:id": `${type}:${id}` }),
  ofType: async (
    type: ItemType,
    { first, after }: { first: number; after?: string }
  ): Promise<Array<ItemDocument> & QueryResponseMeta> => {
    const baseQuery = Item.query("type").eq(type).using("type").limit(first);
    const data = await (after
      ? baseQuery.startAt(fromBase64(after))
      : baseQuery
    ).exec();
    data.lastKey = data.lastKey ? toBase64(data.lastKey) : null;
    return data;
  },
  countOfType: async (
    type: ItemType,
  ): Promise<number> {
    const data = await Item.query("type").eq(type).using("type").all().count().exec();
    return data.count;
  },
  onShelf: async (
    type: ItemType,
    shelf: string,
    { first, after }: { first: number; after?: string }
  ): Promise<Array<ItemDocument> & QueryResponseMeta> => {
    const baseQuery = Item.query("type:shelf")
      .eq(`${type}:${shelf}`)
      .using("shelf")
      .limit(first);
    const data = await (after
      ? baseQuery.startAt(fromBase64(after))
      : baseQuery
    ).exec();
    data.lastKey = data.lastKey ? toBase64(data.lastKey) : null;
    return data;
  },
  countOnShelf: async (type: ItemType, shelf: string): Promise<number> {
    const data = await Item.query("type:shelf").eq(`${type}:${shelf}`).using("shelf").all().count().exec();
    return data.count;
  }
};

function toBase64(lastKey: Object): string {
  return Buffer.from(JSON.stringify(lastKey), "utf-8").toString("base64");
}

function fromBase64(lastKey: string): Object {
  return JSON.parse(Buffer.from(lastKey, "base64").toString("utf-8"));
}
