import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey(), // No defaultRandom - preserve existing IDs
    type: varchar("type", { length: 50 }).notNull(),
    shelf: varchar("shelf", { length: 50 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    rating: integer("rating"),
    imageUrl: text("image_url"),
    imageWidth: integer("image_width"),
    imageHeight: integer("image_height"),
    externalId: varchar("external_id", { length: 255 }),
    notes: text("notes"),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    movedAt: timestamp("moved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    seriesId: uuid("series_id"),
    data: text("data").default("{}"),
  },
  (table) => [
    // Essential indexes (5 total) - matches 0001_initial_schema.sql
    // DSQL doesn't support partial indexes (WHERE clause)
    index("idx_type_moved").on(table.type, table.movedAt),
    index("idx_type_shelf_moved").on(table.type, table.shelf, table.movedAt),
    index("idx_type_title").on(table.type, table.title),
    index("idx_external_id").on(table.externalId),
    index("idx_series_id").on(table.seriesId, table.movedAt),
    check("chk_series_id", sql`series_id IS NULL OR type = 'TvSeason'`),
  ],
);
