import { getDb } from "./db";
import { items } from "./schema";
import {
  eq,
  and,
  between,
  desc,
  asc,
  ilike,
  sql,
  count,
  gte,
  lte,
} from "drizzle-orm";

const DEFAULT_START = new Date("2010-01-01T00:00:00");
const DEFAULT_END = new Date("2200-01-01T00:00:00");

type SortBy = "MOVED_AT" | "ADDED_AT";

type RatingFilter = {
  gte?: number;
  lte?: number;
};

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

type QueryResponse = {
  items: Item[];
  lastKey?: string;
  count: number;
};

type After = {
  offset: number;
};

// Known columns that are stored directly (not in the data JSON)
const KNOWN_COLUMNS = [
  "id",
  "type",
  "shelf",
  "title",
  "rating",
  "notes",
  "externalId",
  "addedAt",
  "movedAt",
  "seriesId",
  "image",
];

// Transform database row to Item interface
function rowToItem(row: typeof items.$inferSelect): Item {
  const data = JSON.parse(row.data || "{}");
  return {
    id: row.id,
    type: row.type,
    shelf: row.shelf,
    title: row.title,
    rating: row.rating ?? undefined,
    notes: row.notes ?? undefined,
    externalId: row.externalId ?? undefined,
    addedAt: row.addedAt,
    movedAt: row.movedAt,
    seriesId: row.seriesId ?? undefined,
    // Parse image JSON (includes sizes array)
    ...(row.image ? { image: JSON.parse(row.image) } : {}),
    // Spread type-specific fields from data JSON
    ...data,
  };
}

// Extract type-specific fields from item
function extractTypeSpecificData(item: Record<string, unknown>): string {
  const typeSpecific: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    if (!KNOWN_COLUMNS.includes(key) && value !== undefined) {
      typeSpecific[key] = value;
    }
  }
  return Object.keys(typeSpecific).length > 0
    ? JSON.stringify(typeSpecific)
    : "{}";
}

// Transform Item to database row for INSERT (explicit nulls for all optional fields)
function itemToInsertRow(item: Partial<Item>) {
  const {
    id,
    type,
    shelf,
    title,
    rating,
    notes,
    externalId,
    addedAt,
    movedAt,
    seriesId,
    image,
    ...rest
  } = item;

  return {
    id: id!,
    type: type!,
    shelf: shelf!,
    title: title!,
    rating: rating ?? null,
    notes: notes ?? null,
    externalId: externalId ?? null,
    addedAt: addedAt!,
    movedAt: movedAt!,
    seriesId: seriesId ?? null,
    image: image ? JSON.stringify(image) : null,
    data: extractTypeSpecificData(rest),
  };
}

// Transform Item to database row for UPDATE (only include provided fields)
function itemToUpdateRow(item: Partial<Item>) {
  const {
    id,
    type,
    shelf,
    title,
    rating,
    notes,
    externalId,
    addedAt,
    movedAt,
    seriesId,
    image,
    ...rest
  } = item;

  return {
    ...(shelf !== undefined ? { shelf } : {}),
    ...(title !== undefined ? { title } : {}),
    ...(rating !== undefined ? { rating } : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(externalId !== undefined ? { externalId } : {}),
    ...(addedAt !== undefined ? { addedAt } : {}),
    ...(movedAt !== undefined ? { movedAt } : {}),
    ...(seriesId !== undefined ? { seriesId } : {}),
    ...(image !== undefined
      ? { image: image ? JSON.stringify(image) : null }
      : {}),
    // Always update data if there are type-specific fields in the update
    ...(Object.keys(rest).length > 0
      ? { data: extractTypeSpecificData(rest) }
      : {}),
  };
}

function toBase64(after: After): string {
  return Buffer.from(JSON.stringify(after), "utf-8").toString("base64");
}

function fromBase64(cursor: string): After {
  return JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
}

function buildRatingCondition(rating?: RatingFilter) {
  if (!rating) return undefined;
  const conditions = [];
  if (rating.gte != null) {
    conditions.push(gte(items.rating, rating.gte));
  }
  if (rating.lte != null) {
    conditions.push(lte(items.rating, rating.lte));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export const Query = {
  withId: async ({ id }: ItemKey): Promise<Item | undefined> => {
    const db = await getDb();
    const [row] = await db.select().from(items).where(eq(items.id, id));
    return row ? rowToItem(row) : undefined;
  },

  withExternalId: async ({
    externalId,
  }: {
    externalId: string;
  }): Promise<Item[]> => {
    const db = await getDb();
    const rows = await db
      .select()
      .from(items)
      .where(eq(items.externalId, externalId))
      .orderBy(asc(items.movedAt));
    return rows.map(rowToItem);
  },

  // Only used for Tv Series - order by seasonNumber for "last season" logic
  withSeriesId: async ({ seriesId }: { seriesId: string }): Promise<Item[]> => {
    const db = await getDb();
    const rows = await db
      .select()
      .from(items)
      .where(eq(items.seriesId, seriesId))
      .orderBy(asc(sql`(${items.data}::json->>'seasonNumber')::int`));
    return rows.map(rowToItem);
  },

  ofType: async (
    { type }: TypeKey,
    {
      first,
      after,
      startDate = DEFAULT_START,
      endDate = DEFAULT_END,
      sortBy = "MOVED_AT",
      rating,
    }: {
      first: number;
      after?: string;
      startDate?: Date;
      endDate?: Date;
      sortBy?: SortBy;
      rating?: RatingFilter;
    },
  ): Promise<QueryResponse> => {
    const db = await getDb();
    const sortColumn = sortBy === "ADDED_AT" ? items.addedAt : items.movedAt;
    const ratingCondition = buildRatingCondition(rating);

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(items)
      .where(
        and(
          eq(items.type, type),
          between(sortColumn, startDate, endDate),
          ratingCondition,
        ),
      );
    const total = countResult?.count ?? 0;

    // Parse cursor
    const { offset }: After = after ? fromBase64(after) : { offset: 0 };

    // Get items
    const rows = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.type, type),
          between(sortColumn, startDate, endDate),
          ratingCondition,
        ),
      )
      .orderBy(desc(sortColumn))
      .limit(first)
      .offset(offset);

    const newOffset = offset + rows.length;
    const hasMore = total > newOffset;

    return {
      items: rows.map(rowToItem),
      count: total,
      lastKey: hasMore ? toBase64({ offset: newOffset }) : undefined,
    };
  },

  searchType: async (
    { type }: TypeKey,
    {
      first,
      after,
      query,
      rating,
    }: { first: number; after?: string; query: string; rating?: RatingFilter },
  ): Promise<QueryResponse> => {
    const db = await getDb();
    const ratingCondition = buildRatingCondition(rating);

    // Get total count - use ILIKE for case-insensitive substring search
    const [countResult] = await db
      .select({ count: count() })
      .from(items)
      .where(
        and(
          eq(items.type, type),
          ilike(items.title, `${query}%`),
          ratingCondition,
        ),
      );
    const total = countResult?.count ?? 0;

    // Parse cursor
    const { offset }: After = after ? fromBase64(after) : { offset: 0 };

    // Get items - ordered by title for prefix search
    const rows = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.type, type),
          ilike(items.title, `${query}%`),
          ratingCondition,
        ),
      )
      .orderBy(asc(items.title))
      .limit(first)
      .offset(offset);

    const newOffset = offset + rows.length;
    const hasMore = total > newOffset;

    return {
      items: rows.map(rowToItem),
      count: total,
      lastKey: hasMore ? toBase64({ offset: newOffset }) : undefined,
    };
  },

  forCategory: async (
    { category }: { category: string },
    { first, after }: { first: number; after?: string },
  ): Promise<QueryResponse> => {
    const db = await getDb();

    // Category is stored in the data JSON column
    const categoryCondition = sql`(${items.data}::json)->>'category' = ${category}`;

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(items)
      .where(categoryCondition);
    const total = countResult?.count ?? 0;

    // Parse cursor
    const { offset }: After = after ? fromBase64(after) : { offset: 0 };

    // Get items
    const rows = await db
      .select()
      .from(items)
      .where(categoryCondition)
      .orderBy(desc(items.movedAt))
      .limit(first)
      .offset(offset);

    const newOffset = offset + rows.length;
    const hasMore = total > newOffset;

    return {
      items: rows.map(rowToItem),
      count: total,
      lastKey: hasMore ? toBase64({ offset: newOffset }) : undefined,
    };
  },

  onShelf: async (
    { type, shelf }: ShelfKey,
    {
      first,
      after,
      startDate = DEFAULT_START,
      endDate = DEFAULT_END,
      sortBy = "MOVED_AT",
      rating,
    }: {
      first: number;
      after?: string;
      startDate?: Date;
      endDate?: Date;
      sortBy?: SortBy;
      rating?: RatingFilter;
    },
  ): Promise<QueryResponse> => {
    const db = await getDb();
    const sortColumn = sortBy === "ADDED_AT" ? items.addedAt : items.movedAt;
    const ratingCondition = buildRatingCondition(rating);

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(items)
      .where(
        and(
          eq(items.type, type),
          eq(items.shelf, shelf),
          between(sortColumn, startDate, endDate),
          ratingCondition,
        ),
      );
    const total = countResult?.count ?? 0;

    // Parse cursor
    const { offset }: After = after ? fromBase64(after) : { offset: 0 };

    // Get items
    const rows = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.type, type),
          eq(items.shelf, shelf),
          between(sortColumn, startDate, endDate),
          ratingCondition,
        ),
      )
      .orderBy(desc(sortColumn))
      .limit(first)
      .offset(offset);

    const newOffset = offset + rows.length;
    const hasMore = total > newOffset;

    return {
      items: rows.map(rowToItem),
      count: total,
      lastKey: hasMore ? toBase64({ offset: newOffset }) : undefined,
    };
  },
};

export const Mutate = {
  async createItem(
    item: CreateItem,
    { updateIfExists = false }: { updateIfExists?: boolean } = {},
  ): Promise<Item> {
    const db = await getDb();
    const date = new Date();
    const withTimestamps = {
      movedAt: date,
      addedAt: date,
      // movedAt and addedAt will be overridden if provided in item
      ...item,
    };

    const insertRow = itemToInsertRow(withTimestamps);

    if (updateIfExists) {
      // Upsert - insert or update on conflict
      const updateRow = itemToUpdateRow(withTimestamps);
      const [result] = await db
        .insert(items)
        .values(insertRow)
        .onConflictDoUpdate({
          target: items.id,
          set: updateRow,
        })
        .returning();
      return rowToItem(result);
    } else {
      // Plain insert
      const [result] = await db.insert(items).values(insertRow).returning();
      return rowToItem(result);
    }
  },

  async deleteItem({ id }: ItemKey): Promise<void> {
    const db = await getDb();
    const result = await db.delete(items).where(eq(items.id, id)).returning();

    if (result.length === 0) {
      throw new Error(`Item with id ${id} not found`);
    }
  },

  async updateItem({ id, type, ...updates }: UpdateItem): Promise<Item> {
    const db = await getDb();
    const now = new Date();

    // If shelf is being updated, also update movedAt
    const updateData = updates.shelf ? { movedAt: now, ...updates } : updates;

    const row = itemToUpdateRow(updateData);

    const [result] = await db
      .update(items)
      .set(row)
      .where(eq(items.id, id))
      .returning();

    if (!result) {
      throw new Error(`Item with id ${id} not found`);
    }

    return rowToItem(result);
  },
};
