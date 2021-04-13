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

const TYPE_ID = ["type", "id"] as const;
const TYPE_SHELF = ["type", "shelf"] as const;
const UPDATED_AT_TYPE_ID = ["updatedAt", "type", "id"] as const;

export interface Item {
  type: ItemType;
  id: string;
  shelf: string;
  title: string;
  updatedAt: Date;
}

class ItemDocument extends Document {
  type: ItemType;
  id: string;
  shelf: string;
  title: string;
  updatedAt: Date;
}

const ItemModel = dynamoose.model<ItemDocument>(
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
      createdAt: Date,
      updatedAt: Date,
      "type:id": {
        type: String,
        hashKey: true,
      },
      "updatedAt:type:id": {
        type: String,
      },
      "type:shelf": {
        type: String,
        index: {
          name: "shelf",
          rangeKey: "updatedAt:type:id",
        },
      },
    },
    {
      saveUnknown: false,
      timestamps: false,
    }
  )
);

type QueryResponse = {
  items: ItemDocument[];
  lastKey?: string;
  count: number;
};

type After = {
  lastKey?: Object;
  countSoFar: number;
};

export const Query = {
  withId: async (
    type: ItemType,
    id: string,
    options?: { consistent?: boolean }
  ) =>
    ItemModel.get(combinedKey({ type, id }, TYPE_ID), {
      consistent: options?.consistent ?? false,
    }),
  ofType: async (
    type: ItemType,
    { first, after }: { first: number; after?: string }
  ): Promise<QueryResponse> => {
    const { count } = await ItemModel.query("type")
      .eq(type)
      .using("type")
      .all()
      .count()
      .exec();
    const baseQuery = ItemModel.query("type")
      .eq(type)
      .using("type")
      .limit(first);
    const { lastKey, countSoFar }: After = after
      ? fromBase64(after)
      : { countSoFar: 0 };
    const data = await (lastKey
      ? baseQuery.startAt(lastKey)
      : baseQuery
    ).exec();
    const newCountSoFar = countSoFar + data.count;
    const newLastKey =
      count > newCountSoFar && data.lastKey
        ? toBase64({ countSoFar: newCountSoFar, lastKey: data.lastKey })
        : undefined;
    return {
      items: Array.from(data),
      count,
      lastKey: newLastKey,
    };
  },
  onShelf: async (
    type: ItemType,
    shelf: string,
    { first, after }: { first: number; after?: string }
  ): Promise<QueryResponse> => {
    // TODO: Use combinedKey?
    const key = `${type}:${shelf}`;
    const { count } = await ItemModel.query("type:shelf")
      .eq(key)
      .using("shelf")
      .all()
      .count()
      .exec();
    const baseQuery = ItemModel.query("type:shelf")
      .eq(key)
      .using("shelf")
      .limit(first);
    const { lastKey, countSoFar }: After = after
      ? fromBase64(after)
      : { countSoFar: 0 };
    const data = await (lastKey
      ? baseQuery.startAt(lastKey)
      : baseQuery
    ).exec();
    const newCountSoFar = countSoFar + data.count;
    const newLastKey =
      count > newCountSoFar && data.lastKey
        ? toBase64({ countSoFar: newCountSoFar, lastKey: data.lastKey })
        : undefined;
    return {
      items: Array.from(data),
      count,
      lastKey: newLastKey,
    };
  },
};

export const Mutate = {
  async createItem(
    item: Pick<ItemDocument, "id" | "type" | "shelf" | "title">
  ): Promise<ItemDocument> {
    const date = new Date();
    const withTimestamps = {
      ...item,
      updatedAt: date,
      createdAt: date,
    };
    await ItemModel.create({
      ...withTimestamps,
      ...combinedKey(withTimestamps, TYPE_ID),
      ...combinedKey(withTimestamps, TYPE_SHELF),
      ...combinedKey(withTimestamps, UPDATED_AT_TYPE_ID),
    });
    return Query.withId(item.type, item.id, { consistent: true });
  },
  async deleteItem({
    id,
    type,
  }: Pick<ItemDocument, "id" | "type">): Promise<void> {
    await ItemModel.delete(combinedKey({ id, type }, TYPE_ID));
  },
  async moveShelf({
    type,
    id,
    shelf,
  }: Pick<ItemDocument, "id" | "type" | "shelf">): Promise<ItemDocument> {
    const date = new Date();
    await ItemModel.update(combinedKey({ type, id }, TYPE_ID), {
      shelf,
      updatedAt: date,
      ...combinedKey({ type, shelf }, TYPE_SHELF),
      ...combinedKey({ updatedAt: date, type, id }, UPDATED_AT_TYPE_ID),
    });
    return await Query.withId(type, id, { consistent: true });
  },
};

function combinedKey<T>(item: T, keys: ReadonlyArray<keyof T>) {
  const key = keys.join(":");
  const value = keys
    .map((k) => item[k])
    .map((v) => (v instanceof Date ? v.getTime() : v))
    .join(":");
  return { [key]: value };
}

function toBase64(lastKey: After): string {
  return Buffer.from(JSON.stringify(lastKey), "utf-8").toString("base64");
}

function fromBase64(lastKey: string): After {
  return JSON.parse(Buffer.from(lastKey, "base64").toString("utf-8"));
}
