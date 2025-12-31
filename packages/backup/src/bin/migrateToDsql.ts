/**
 * Migration script: DynamoDB JSON backups → Aurora DSQL
 *
 * Usage:
 *   1. First run localBackup.ts to export current DynamoDB data to ./local/*.json
 *   2. Set environment variables:
 *      - BILLIO_DSQL_ENDPOINT: The DSQL cluster endpoint
 *      - AWS_REGION: AWS region (defaults to us-east-1)
 *      - AWS_PROFILE: AWS profile for credentials (optional)
 *   3. Run: npx tsx src/bin/migrateToDsql.ts
 *
 * The script preserves existing UUIDs and handles all data transformations.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { DsqlSigner } from "@aws-sdk/dsql-signer";
import { readFileSync, existsSync } from "fs";
import { TYPES } from "@mattb.tech/billio-config";

// Define the items table schema inline (matches packages/data/src/schema.ts)
const items = pgTable("items_v2", {
  id: uuid("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  shelf: varchar("shelf", { length: 50 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  rating: integer("rating"),
  image: text("image"), // JSON string with full structure including sizes array
  externalId: varchar("external_id", { length: 255 }),
  notes: text("notes"),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  movedAt: timestamp("moved_at", { withTimezone: true }).notNull().defaultNow(),
  seriesId: uuid("series_id"),
  data: text("data").default("{}"),
});

// Type definitions for DynamoDB backup items
interface DynamoImageSize {
  url: string;
  width?: number;
  height?: number;
  size: string;
}

interface DynamoImage {
  url?: string;
  width?: number;
  height?: number;
  sizes?: DynamoImageSize[];
}

interface DynamoBaseItem {
  id: string;
  type: string;
  shelf: string;
  title: string;
  rating?: number;
  image?: DynamoImage;
  externalId?: string;
  notes?: string;
  addedAt: string | number;
  movedAt: string | number;
  // DynamoDB composite keys (ignored in migration)
  "type:id"?: string;
  "type:shelf"?: string;
}

interface BookItem extends DynamoBaseItem {
  type: "Book";
  author: string;
  reread?: boolean;
}

interface VideoGameItem extends DynamoBaseItem {
  type: "VideoGame";
  platforms?: string[];
  devices?: string[];
  replay?: boolean;
  hoursPlayed?: number;
}

interface FeatureItem extends DynamoBaseItem {
  type: "Feature";
  releaseYear: string;
  rewatch?: boolean;
  category?: string;
}

interface TvSeriesItem extends DynamoBaseItem {
  type: "TvSeries";
  releaseYear: string;
  category?: string;
}

interface TvSeasonItem extends DynamoBaseItem {
  type: "TvSeason";
  seriesId: string;
  seasonNumber: number;
  seasonTitle?: string;
  releaseYear: string;
  rewatch?: boolean;
}

type DynamoItem =
  | BookItem
  | VideoGameItem
  | FeatureItem
  | TvSeriesItem
  | TvSeasonItem;

// Type-specific field extractors
const TYPE_SPECIFIC_FIELDS: Record<string, string[]> = {
  Book: ["author", "reread"],
  VideoGame: ["platforms", "devices", "replay", "hoursPlayed"],
  Feature: ["releaseYear", "rewatch", "category"],
  TvSeries: ["releaseYear", "category"],
  TvSeason: ["seasonNumber", "seasonTitle", "releaseYear", "rewatch"],
};

// Fields to exclude from the data JSON (stored in dedicated columns)
const COMMON_FIELDS = [
  "id",
  "type",
  "shelf",
  "title",
  "rating",
  "image",
  "externalId",
  "notes",
  "addedAt",
  "movedAt",
  "seriesId",
  "type:id",
  "type:shelf",
];

async function getDbConnection() {
  const endpoint = process.env.BILLIO_DSQL_ENDPOINT;
  if (!endpoint) {
    throw new Error("BILLIO_DSQL_ENDPOINT environment variable is required");
  }

  const region = process.env.AWS_REGION || "us-east-1";

  console.log(`Connecting to DSQL at ${endpoint} in ${region}...`);

  const signer = new DsqlSigner({ hostname: endpoint, region });
  const token = await signer.getDbConnectAdminAuthToken();

  const pool = new Pool({
    host: endpoint,
    port: 5432,
    user: "admin",
    password: token,
    database: "postgres",
    ssl: { rejectUnauthorized: true },
  });

  return { db: drizzle(pool, { schema: { items } }), pool };
}

function parseTimestamp(value: string | number): Date {
  if (typeof value === "number") {
    return new Date(value);
  }
  return new Date(value);
}

function extractTypeSpecificData(item: DynamoItem): Record<string, unknown> {
  const typeFields = TYPE_SPECIFIC_FIELDS[item.type] || [];
  const data: Record<string, unknown> = {};
  const itemRecord = item as unknown as Record<string, unknown>;

  for (const field of typeFields) {
    if (field in item && itemRecord[field] !== undefined) {
      data[field] = itemRecord[field];
    }
  }

  // Also include any unknown fields (due to saveUnknown: true in DynamoDB)
  for (const [key, value] of Object.entries(item)) {
    if (
      !COMMON_FIELDS.includes(key) &&
      !typeFields.includes(key) &&
      value !== undefined
    ) {
      data[key] = value;
    }
  }

  return data;
}

function transformItem(item: DynamoItem) {
  // Preserve full image structure including sizes array
  let image: string | null = null;

  if (item.image) {
    image = JSON.stringify({
      url: item.image.url,
      width: item.image.width,
      height: item.image.height,
      sizes: item.image.sizes || [],
    });
  }

  // Extract type-specific fields for data column
  const typeSpecificData = extractTypeSpecificData(item);

  return {
    id: item.id,
    type: item.type,
    shelf: item.shelf,
    title: item.title,
    rating: item.rating ?? null,
    image,
    externalId: item.externalId ?? null,
    notes: item.notes ?? null,
    addedAt: parseTimestamp(item.addedAt),
    movedAt: parseTimestamp(item.movedAt),
    seriesId: item.type === "TvSeason" ? (item as TvSeasonItem).seriesId : null,
    data: JSON.stringify(typeSpecificData),
  };
}

async function migrateType(
  db: ReturnType<typeof drizzle>,
  type: string,
): Promise<number> {
  const filePath = `./local/${type}.json`;

  if (!existsSync(filePath)) {
    console.log(`  Skipping ${type} - no backup file found at ${filePath}`);
    return 0;
  }

  const rawData = readFileSync(filePath, "utf-8");
  const data: DynamoItem[] = JSON.parse(rawData);

  if (data.length === 0) {
    console.log(`  Skipping ${type} - no items in backup`);
    return 0;
  }

  console.log(`  Migrating ${data.length} ${type} items...`);

  // Insert in batches to avoid memory issues
  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const transformedBatch = batch.map(transformItem);

    await db.insert(items).values(transformedBatch);
    inserted += batch.length;

    if (data.length > BATCH_SIZE) {
      console.log(`    Inserted ${inserted}/${data.length}...`);
    }
  }

  return data.length;
}

async function verifyMigration(
  db: ReturnType<typeof drizzle>,
  type: string,
  expectedCount: number,
): Promise<boolean> {
  const result = await db.select().from(items).where(eq(items.type, type));

  const actualCount = result.length;
  const success = actualCount === expectedCount;

  if (success) {
    console.log(`  ✓ ${type}: ${actualCount} items verified`);
  } else {
    console.log(`  ✗ ${type}: Expected ${expectedCount}, found ${actualCount}`);
  }

  return success;
}

async function verifySeriesIdRelationships(
  db: ReturnType<typeof drizzle>,
): Promise<boolean> {
  console.log("\nVerifying TvSeason → TvSeries relationships...");

  // Get all TvSeasons with seriesId
  const seasons = await db
    .select()
    .from(items)
    .where(eq(items.type, "TvSeason"));

  // Get all TvSeries IDs
  const series = await db
    .select({ id: items.id })
    .from(items)
    .where(eq(items.type, "TvSeries"));

  const seriesIds = new Set(series.map((s) => s.id));

  let invalidCount = 0;
  for (const season of seasons) {
    if (season.seriesId && !seriesIds.has(season.seriesId)) {
      console.log(
        `  ✗ TvSeason ${season.id} references non-existent series ${season.seriesId}`,
      );
      invalidCount++;
    }
  }

  if (invalidCount === 0) {
    console.log(
      `  ✓ All ${seasons.length} TvSeason items have valid series references`,
    );
    return true;
  } else {
    console.log(`  ✗ ${invalidCount} TvSeason items have invalid references`);
    return false;
  }
}

async function main() {
  console.log("=== DynamoDB to Aurora DSQL Migration ===\n");

  const { db, pool } = await getDbConnection();

  try {
    // Migration order: TvSeries must come before TvSeason due to seriesId reference
    const orderedTypes = [
      "Book",
      "VideoGame",
      "Feature",
      "TvSeries",
      "TvSeason",
    ];

    // Verify we have all expected types
    for (const type of TYPES) {
      if (!orderedTypes.includes(type)) {
        console.warn(
          `Warning: Type ${type} from config not in migration order`,
        );
      }
    }

    console.log("Phase 1: Migrating data...\n");

    const counts: Record<string, number> = {};
    let totalMigrated = 0;

    for (const type of orderedTypes) {
      const count = await migrateType(db, type);
      counts[type] = count;
      totalMigrated += count;
    }

    console.log(`\nMigrated ${totalMigrated} total items\n`);

    console.log("Phase 2: Verifying row counts...\n");

    let allVerified = true;
    for (const type of orderedTypes) {
      if (counts[type] > 0) {
        const verified = await verifyMigration(db, type, counts[type]);
        allVerified = allVerified && verified;
      }
    }

    // Verify seriesId relationships
    const relationshipsValid = await verifySeriesIdRelationships(db);
    allVerified = allVerified && relationshipsValid;

    console.log("\n=== Migration Summary ===\n");

    for (const type of orderedTypes) {
      console.log(`  ${type}: ${counts[type]} items`);
    }
    console.log(`  ─────────────────────`);
    console.log(`  Total: ${totalMigrated} items`);

    if (allVerified) {
      console.log("\n✓ Migration completed successfully!");
    } else {
      console.log("\n✗ Migration completed with verification errors");
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
