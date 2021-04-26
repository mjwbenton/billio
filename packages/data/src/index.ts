import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";

dynamoose.model.defaults.set({
  create: false,
  update: false,
  waitForActive: false,
});

const TABLE_NAME = process.env.BILLIO_TABLE!;

const TYPE_ID = ["type", "id"] as const;
const TYPE_SHELF = ["type", "shelf"] as const;
const UPDATED_AT_TYPE_ID = ["updatedAt", "type", "id"] as const;

export interface Item {
  type: string;
  id: string;
  shelf: string;
  updatedAt: Date;
  createdAt: Date;
  [additional: string]: any;
}

type TypeKey = Pick<Item, "type">;
type ItemKey = TypeKey & Pick<Item, "id">;
type ShelfKey = TypeKey & Pick<Item, "shelf">;
type UpdateItem = ItemKey & Omit<Partial<Item>, "updatedAt" | "createdAt">;
type CreateItem = ItemKey &
  ShelfKey &
  Omit<Partial<Item>, "updatedAt" | "createdAt">;

class ItemDocument extends Document implements Item {
  type: string;
  id: string;
  shelf: string;
  updatedAt: Date;
  createdAt: Date;
  [additional: string]: any;
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
      saveUnknown: true,
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
    { type, id }: ItemKey,
    options?: { consistent?: boolean }
  ): Promise<Item> =>
    ItemModel.get(combinedKey({ type, id }, TYPE_ID), {
      consistent: options?.consistent ?? false,
    }),
  ofType: async (
    { type }: TypeKey,
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
    { type, shelf }: ShelfKey,
    { first, after }: { first: number; after?: string }
  ): Promise<QueryResponse> => {
    const key = combineValue({ type, shelf }, TYPE_SHELF);
    const { count } = await ItemModel.query(combineKey(TYPE_SHELF))
      .eq(key)
      .using("shelf")
      .all()
      .count()
      .exec();
    const baseQuery = ItemModel.query(combineKey(TYPE_SHELF))
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
  async createItem({ id, type, ...rest }: CreateItem): Promise<Item> {
    const date = new Date();
    const withTimestamps = {
      id,
      type,
      ...rest,
      updatedAt: date,
      createdAt: date,
    };
    await ItemModel.create({
      ...withTimestamps,
      ...combinedKey(withTimestamps, TYPE_ID),
      ...combinedKey(withTimestamps, TYPE_SHELF),
      ...combinedKey(withTimestamps, UPDATED_AT_TYPE_ID),
    });
    return Query.withId({ type, id }, { consistent: true });
  },
  async deleteItem({ id, type }: ItemKey): Promise<void> {
    await ItemModel.delete(combinedKey({ id, type }, TYPE_ID));
  },
  async updateItem({ id, type, ...updates }: UpdateItem) {
    const date = new Date();
    await ItemModel.update(combinedKey({ type, id }, TYPE_ID), {
      ...updates,
      updatedAt: date,
      ...(updates.shelf
        ? combinedKey({ type, shelf: updates.shelf }, TYPE_SHELF)
        : {}),
      ...combinedKey({ updatedAt: date, type, id }, UPDATED_AT_TYPE_ID),
    });
    return await Query.withId({ type, id }, { consistent: true });
  },
};

function combineValue<T>(item: T, keys: ReadonlyArray<keyof T>) {
  return keys
    .map((k) => item[k])
    .map((v) => (v instanceof Date ? v.getTime() : v))
    .join(":");
}

function combineKey(keys: ReadonlyArray<unknown>) {
  return keys.join(":");
}

function combinedKey<T>(item: T, keys: ReadonlyArray<keyof T>) {
  return { [combineKey(keys)]: combineValue(item, keys) };
}

function toBase64(lastKey: After): string {
  return Buffer.from(JSON.stringify(lastKey), "utf-8").toString("base64");
}

function fromBase64(lastKey: string): After {
  return JSON.parse(Buffer.from(lastKey, "base64").toString("utf-8"));
}
