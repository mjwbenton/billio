import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";
import { SortOrder } from "dynamoose/dist/General";

dynamoose.model.defaults.set({
  create: false,
  update: false,
  waitForActive: false,
});

const TABLE_NAME = process.env.BILLIO_TABLE!;

const TYPE_ID = ["type", "id"] as const;
const TYPE_SHELF = ["type", "shelf"] as const;
const MOVED_AT_TYPE_ID = ["movedAt", "type", "id"] as const;

export interface Item {
  type: string;
  id: string;
  shelf: string;
  movedAt: Date;
  addedAt: Date;
  [additional: string]: any;
}

type TypeKey = Pick<Item, "type">;
type ItemKey = TypeKey & Pick<Item, "id">;
type ShelfKey = TypeKey & Pick<Item, "shelf">;
export type UpdateItem = ItemKey & Partial<Item>;
export type CreateItem = ItemKey & ShelfKey & Partial<Item>;

class ItemDocument extends Document implements Item {
  type: string;
  id: string;
  shelf: string;
  movedAt: Date;
  addedAt: Date;
  [additional: string]: any;
}

const ItemModel = dynamoose.model<ItemDocument>(
  TABLE_NAME,
  new dynamoose.Schema(
    {
      id: String,
      type: {
        type: String,
        index: [
          {
            global: true,
            name: "type",
            rangeKey: "movedAt:type:id",
          },
          {
            global: true,
            name: "title",
            rangeKey: "title",
          },
        ],
      },
      shelf: String,
      addedAt: Date,
      movedAt: Date,
      externalId: {
        type: String,
        index: {
          global: true,
          name: "externalId",
          rangeKey: "movedAt:type:id",
        },
      },
      title: {
        type: String,
      },
      category: {
        type: String,
        index: {
          global: true,
          name: "category",
          rangeKey: "movedAt:type:id",
        },
      },
      "type:id": {
        type: String,
        hashKey: true,
      },
      "movedAt:type:id": {
        type: String,
      },
      "type:shelf": {
        type: String,
        index: {
          global: true,
          name: "shelf",
          rangeKey: "movedAt:type:id",
        },
      },
      // Tv Series only
      seriesId: {
        type: String,
        index: {
          global: true,
          name: "seriesId",
          rangeKey: "movedAt:type:id",
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
    { consistent = false }: { consistent?: boolean } = {}
  ): Promise<Item | undefined> =>
    ItemModel.get(combinedKey({ type, id }, TYPE_ID), {
      consistent,
    }),
  withExternalId: async ({
    externalId,
  }: {
    externalId: string;
  }): Promise<Item[]> => {
    const data = await ItemModel.query("externalId")
      .eq(externalId)
      .sort(SortOrder.ascending)
      .using("externalId")
      .exec();
    return Array.from<Item>(data);
  },
  // Only used for Tv Series
  withSeriesId: async ({ seriesId }: { seriesId: string }): Promise<Item[]> => {
    const data = await ItemModel.query("seriesId")
      .eq(seriesId)
      .using("seriesId")
      .exec();
    return Array.from<Item>(data);
  },
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
      .sort(SortOrder.descending)
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
  searchType: async (
    { type }: TypeKey,
    { first, after, query }: { first: number; after?: string; query: string }
  ): Promise<QueryResponse> => {
    const { count } = await ItemModel.query("type")
      .eq(type)
      .where("title")
      .beginsWith(query)
      .using("title")
      .all()
      .count()
      .exec();
    const baseQuery = ItemModel.query("type")
      .eq(type)
      .where("title")
      .beginsWith(query)
      .using("title")
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
  forCategory: async (
    { category }: { category: string },
    { first, after }: { first: number; after?: string }
  ): Promise<QueryResponse> => {
    const { count } = await ItemModel.query("category")
      .eq(category)
      .using("category")
      .all()
      .count()
      .exec();
    const baseQuery = ItemModel.query("category")
      .eq(category)
      .sort(SortOrder.descending)
      .using("category")
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
      .sort(SortOrder.descending)
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
    { id, type, ...rest }: CreateItem,
    { updateIfExists = false }: { updateIfExists?: boolean } = {}
  ): Promise<Item> {
    const date = new Date();
    const withTimestamps = {
      id,
      type,
      movedAt: date,
      addedAt: date,
      // movedAt and addedAt will be overriden if provided
      ...rest,
    };
    await ItemModel.create(
      {
        ...withTimestamps,
        ...combinedKey(withTimestamps, TYPE_ID),
        ...combinedKey(withTimestamps, TYPE_SHELF),
        ...combinedKey(withTimestamps, MOVED_AT_TYPE_ID),
      },
      {
        overwrite: updateIfExists,
      }
    );
    return (await Query.withId({ type, id }, { consistent: true }))!;
  },
  async deleteItem({ id, type }: ItemKey): Promise<void> {
    const key = combinedKey({ type, id }, TYPE_ID);
    await ItemModel.delete(key, {
      condition: new dynamoose.Condition().filter("type:id").exists(),
    });
  },
  async updateItem({ id, type, ...updates }: UpdateItem): Promise<Item> {
    const now = new Date();
    const key = combinedKey({ type, id }, TYPE_ID);
    await ItemModel.update(
      key,
      {
        // If the shelf is updated, update the movedAt timestamp
        ...(updates.shelf
          ? {
              movedAt: now,
              ...combinedKey({ type, shelf: updates.shelf }, TYPE_SHELF),
              ...combinedKey({ movedAt: now, type, id }, MOVED_AT_TYPE_ID),
            }
          : {}),
        // If movedAt is overridden, update the related combinedKey
        ...(updates.movedAt
          ? {
              movedAt: updates.movedAt,
              ...combinedKey(
                { movedAt: updates.movedAt, type, id },
                MOVED_AT_TYPE_ID
              ),
            }
          : {}),
        ...updates,
      },
      {
        condition: new dynamoose.Condition().filter("type:id").exists(),
      }
    );
    const item = await Query.withId({ type, id }, { consistent: true });
    return item!;
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
