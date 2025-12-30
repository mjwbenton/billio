import { getDb } from "./db";
import { items } from "./schema";
import { eq, and, between, desc, asc, ilike, sql, count } from "drizzle-orm";

const DEFAULT_START = new Date("2010-01-01T00:00:00");
const DEFAULT_END = new Date("2200-01-01T00:00:00");

type SortBy = "MOVED_AT" | "ADDED_AT";

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
  "imageUrl",
  "imageWidth",
  "imageHeight",
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
    // Reconstruct image object from flat columns
    ...(row.imageUrl
      ? {
          image: {
            url: row.imageUrl,
            width: row.imageWidth ?? undefined,
            height: row.imageHeight ?? undefined,
          },
        }
      : {}),
    // Spread type-specific fields from data JSON
    ...data,
  };
}

// Transform Item to database row for inserts/updates
function itemToRow(item: Partial<Item>) {
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

  // Separate type-specific fields from known columns
  const typeSpecific: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (!KNOWN_COLUMNS.includes(key) && value !== undefined) {
      typeSpecific[key] = value;
    }
  }

  return {
    ...(id !== undefined ? { id } : {}),
    ...(type !== undefined ? { type } : {}),
    ...(shelf !== undefined ? { shelf } : {}),
    ...(title !== undefined ? { title } : {}),
    ...(rating !== undefined ? { rating } : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(externalId !== undefined ? { externalId } : {}),
    ...(addedAt !== undefined ? { addedAt } : {}),
    ...(movedAt !== undefined ? { movedAt } : {}),
    ...(seriesId !== undefined ? { seriesId } : {}),
    // Flatten image
    ...(image
      ? {
          imageUrl: image.url,
          imageWidth: image.width,
          imageHeight: image.height,
        }
      : {}),
    // Store type-specific in data column (only if there are any)
    ...(Object.keys(typeSpecific).length > 0
      ? { data: JSON.stringify(typeSpecific) }
      : {}),
  };
}

function toBase64(after: After): string {
  return Buffer.from(JSON.stringify(after), "utf-8").toString("base64");
}

function fromBase64(cursor: string): After {
  return JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
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

  // Only used for Tv Series
  withSeriesId: async ({ seriesId }: { seriesId: string }): Promise<Item[]> => {
    const db = await getDb();
    const rows = await db
      .select()
      .from(items)
      .where(eq(items.seriesId, seriesId))
      .orderBy(asc(items.movedAt));
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
    }: {
      first: number;
      after?: string;
      startDate?: Date;
      endDate?: Date;
      sortBy?: SortBy;
    },
  ): Promise<QueryResponse> => {
    const db = await getDb();
    const sortColumn = sortBy === "ADDED_AT" ? items.addedAt : items.movedAt;

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(items)
      .where(
        and(eq(items.type, type), between(sortColumn, startDate, endDate)),
      );
    const total = countResult?.count ?? 0;

    // Parse cursor
    const { offset }: After = after ? fromBase64(after) : { offset: 0 };

    // Get items
    const rows = await db
      .select()
      .from(items)
      .where(and(eq(items.type, type), between(sortColumn, startDate, endDate)))
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
    { first, after, query }: { first: number; after?: string; query: string },
  ): Promise<QueryResponse> => {
    const db = await getDb();

    // Get total count - use ILIKE for case-insensitive substring search
    const [countResult] = await db
      .select({ count: count() })
      .from(items)
      .where(and(eq(items.type, type), ilike(items.title, `${query}%`)));
    const total = countResult?.count ?? 0;

    // Parse cursor
    const { offset }: After = after ? fromBase64(after) : { offset: 0 };

    // Get items - ordered by title for prefix search
    const rows = await db
      .select()
      .from(items)
      .where(and(eq(items.type, type), ilike(items.title, `${query}%`)))
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
    }: {
      first: number;
      after?: string;
      startDate?: Date;
      endDate?: Date;
      sortBy?: SortBy;
    },
  ): Promise<QueryResponse> => {
    const db = await getDb();
    const sortColumn = sortBy === "ADDED_AT" ? items.addedAt : items.movedAt;

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(items)
      .where(
        and(
          eq(items.type, type),
          eq(items.shelf, shelf),
          between(sortColumn, startDate, endDate),
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

    const row = itemToRow(withTimestamps);

    if (updateIfExists) {
      // Upsert - insert or update on conflict
      const [result] = await db
        .insert(items)
        .values(row as typeof items.$inferInsert)
        .onConflictDoUpdate({
          target: items.id,
          set: row,
        })
        .returning();
      return rowToItem(result);
    } else {
      // Plain insert
      const [result] = await db
        .insert(items)
        .values(row as typeof items.$inferInsert)
        .returning();
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

    const row = itemToRow(updateData);

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
