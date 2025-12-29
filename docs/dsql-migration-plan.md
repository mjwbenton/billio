# DynamoDB to Aurora DSQL Migration Plan

## Overview

Migrate Billio from DynamoDB to Aurora DSQL to gain:
- Flexible index management (add indexes anytime vs. pre-planned GSIs)
- Combined query filters (search + date, rating filters)
- Standard PostgreSQL tooling and SQL

## Current State

- **DynamoDB single-table design** with 8 GSIs
- **Dynamoose ORM** in `packages/data`
- **JSON backups** available in `packages/backup`
- **Limitations:** Cannot combine search + date filters, prefix-only title search

---

## Schema Design

Single table with type-specific fields in JSONB column called `data`:

```sql
CREATE TABLE items (
  id UUID PRIMARY KEY,  -- Preserve existing IDs from DynamoDB (no auto-generation)
  type VARCHAR(50) NOT NULL,  -- 'Book', 'VideoGame', 'Feature', 'TvSeries', 'TvSeason'
  shelf VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  rating DECIMAL(2,1),
  image_url TEXT,
  image_width INT,
  image_height INT,
  external_id VARCHAR(255),
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- TvSeason -> TvSeries relationship
  series_id UUID REFERENCES items(id),

  -- Type-specific fields
  data JSONB DEFAULT '{}'::jsonb
  -- Books: {"author": "...", "reread": false}
  -- VideoGames: {"platforms": [...], "devices": [...], "hoursPlayed": 50, "replay": false}
  -- Features: {"releaseYear": "2023", "rewatch": false}
  -- TvSeries: {"releaseYear": "2020"}
  -- TvSeasons: {"seasonNumber": 1, "seasonTitle": "...", "releaseYear": "2020", "rewatch": false}
);

-- Core indexes
CREATE INDEX idx_type_moved ON items(type, moved_at DESC);
CREATE INDEX idx_type_added ON items(type, added_at DESC);
CREATE INDEX idx_type_shelf_moved ON items(type, shelf, moved_at DESC);
CREATE INDEX idx_type_shelf_added ON items(type, shelf, added_at DESC);
CREATE INDEX idx_type_title ON items(type, title);
CREATE INDEX idx_external_id ON items(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_series_id ON items(series_id, moved_at DESC) WHERE series_id IS NOT NULL;

-- Rating filter support
CREATE INDEX idx_type_rating ON items(type, rating DESC NULLS LAST);
CREATE INDEX idx_type_shelf_rating ON items(type, shelf, rating DESC NULLS LAST);

-- Constraint: series_id only valid for TvSeason
ALTER TABLE items ADD CONSTRAINT chk_series_id
  CHECK (series_id IS NULL OR type = 'TvSeason');
```

**Note:** `category` field removed - type groupings (e.g., "watching" = Feature + TvSeries) will be hardcoded in application code.

---

## Migration Phases

### Phase 1: Infrastructure (CDK)

**Goal:** Add Aurora DSQL cluster to BillioDataStack alongside existing DynamoDB table.

**Files to modify:**
- `packages/cdk/src/BillioDataStack.ts` - Add DSQL cluster

**Tasks:**
- [ ] Add Aurora DSQL cluster to BillioDataStack
- [ ] Export cluster endpoint for Lambda access
- [ ] Create IAM roles/policies for Lambda → DSQL access
- [ ] Update BillioApiStack to pass DSQL endpoint to Lambda environment
- [ ] Deploy to test environment first

**CDK Changes to BillioDataStack:**
```typescript
// packages/cdk/src/BillioDataStack.ts
import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AttributeType, BillingMode, ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import * as dsql from "aws-cdk-lib/aws-dsql";

export default class BillioDataStack extends Stack {
  public readonly itemTable: ITable;
  public readonly dsqlCluster: dsql.CfnCluster;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Existing DynamoDB table (keep during migration)
    const itemTable = new Table(this, "ItemTable", {
      // ... existing config
    });
    // ... existing GSIs

    this.itemTable = itemTable;

    // NEW: Aurora DSQL cluster
    this.dsqlCluster = new dsql.CfnCluster(this, "BillioDsqlCluster", {
      deletionProtectionEnabled: true,
      // Tags, etc.
    });
  }
}
```

**Deliverable:** DSQL cluster running alongside DynamoDB, endpoint available to Lambdas.

---

### Phase 2: Data Migration

**Goal:** Export data from DynamoDB and import into Aurora DSQL, preserving existing UUIDs.

**Files to modify:**
- `packages/backup/src/bin/` - Add migration script

**Important:** Existing UUIDs must be preserved as they are referenced by external systems.

**Tasks:**
- [ ] Run existing backup to get latest JSON exports
- [ ] Create migration script to transform JSON → SQL INSERTs
- [ ] Handle data transformations:
  - **Preserve existing `id` values** (do NOT generate new UUIDs)
  - Convert timestamps to TIMESTAMPTZ
  - Map `type:id` composite keys to separate fields
  - Extract type-specific fields into `data` JSONB
  - Preserve `seriesId` references (TvSeason → TvSeries)
- [ ] Run migration against test DSQL cluster
- [ ] Verify row counts match
- [ ] Spot-check data integrity
- [ ] Verify `seriesId` foreign key relationships are valid

**Migration Script Outline:**
```typescript
// packages/backup/src/bin/migrateToDsql.ts
import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { items } from '@mattb.tech/billio-data/schema';

const pool = new Pool({ connectionString: process.env.DSQL_CONNECTION_STRING });
const db = drizzle(pool);

async function migrateType(type: string) {
  const data = JSON.parse(readFileSync(`./local/${type}.json`, 'utf-8'));

  for (const item of data) {
    // Extract common fields - PRESERVE EXISTING ID
    const { id, type: itemType, shelf, title, rating, image, externalId, notes,
            addedAt, movedAt, seriesId, ...typeSpecificFields } = item;

    await db.insert(items).values({
      id,  // Preserve existing UUID - referenced by external systems
      type: itemType,
      shelf,
      title,
      rating,
      imageUrl: image?.url,
      imageWidth: image?.width,
      imageHeight: image?.height,
      externalId,
      notes,
      addedAt: new Date(addedAt),
      movedAt: new Date(movedAt),
      seriesId: seriesId ?? null,  // Preserve TvSeason → TvSeries reference
      data: typeSpecificFields
    });
  }

  console.log(`Migrated ${data.length} ${type} items`);
}

async function main() {
  // Migrate TvSeries BEFORE TvSeason to satisfy FK constraint
  const orderedTypes = ['Book', 'VideoGame', 'Feature', 'TvSeries', 'TvSeason'];
  for (const type of orderedTypes) {
    await migrateType(type);
  }
}
```

**Deliverable:** All data in DSQL with preserved IDs, verified against DynamoDB counts.

---

### Phase 3: Code Changes

**Goal:** Update application code to use Aurora DSQL instead of DynamoDB.

#### 3a. Data Layer Rewrite

**Files to modify:**
- `packages/data/src/` - Complete rewrite

**Tasks:**
- [ ] Add Drizzle ORM dependencies (`drizzle-orm`, `pg`)
- [ ] Create Drizzle schema definition
- [ ] Rewrite `Query` object with Drizzle queries
- [ ] Rewrite `Mutate` object with Drizzle mutations
- [ ] Update pagination to use OFFSET/LIMIT or keyset pagination
- [ ] Remove Dynamoose dependency

**Drizzle Schema:**
```typescript
// packages/data/src/schema.ts
import { pgTable, uuid, varchar, decimal, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';

export const items = pgTable('items', {
  id: uuid('id').primaryKey(),  // No defaultRandom - preserve existing IDs
  type: varchar('type', { length: 50 }).notNull(),
  shelf: varchar('shelf', { length: 50 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  rating: decimal('rating', { precision: 2, scale: 1 }),
  imageUrl: text('image_url'),
  imageWidth: integer('image_width'),
  imageHeight: integer('image_height'),
  externalId: varchar('external_id', { length: 255 }),
  notes: text('notes'),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  movedAt: timestamp('moved_at', { withTimezone: true }).notNull().defaultNow(),
  seriesId: uuid('series_id'),
  data: jsonb('data').default({})
});
```

**Query Implementation:**
```typescript
// packages/data/src/query.ts
import { db } from './db';
import { items } from './schema';
import { eq, and, gte, lte, desc, asc, ilike, sql } from 'drizzle-orm';

export const Query = {
  withId: async ({ type, id }) => {
    const [item] = await db.select().from(items)
      .where(and(eq(items.type, type), eq(items.id, id)));
    return item ?? null;
  },

  ofType: async ({ type }, { first, after, startDate, endDate, sortBy, searchTerm, minRating }) => {
    const conditions = [
      eq(items.type, type),
      gte(items.movedAt, startDate ?? new Date('2010-01-01')),
      lte(items.movedAt, endDate ?? new Date('2200-01-01'))
    ];

    // NEW: Can combine search + date (impossible in DynamoDB!)
    if (searchTerm) {
      conditions.push(ilike(items.title, `%${searchTerm}%`));
    }

    // NEW: Rating filter
    if (minRating) {
      conditions.push(gte(items.rating, minRating));
    }

    const sortCol = sortBy === 'ADDED_AT' ? items.addedAt : items.movedAt;

    return db.select().from(items)
      .where(and(...conditions))
      .orderBy(desc(sortCol))
      .limit(first)
      .offset(after ?? 0);
  },

  onShelf: async ({ type, shelf }, options) => {
    // Similar to ofType with additional shelf filter
    return db.select().from(items)
      .where(and(
        eq(items.type, type),
        eq(items.shelf, shelf),
        // ... other conditions
      ))
      .orderBy(desc(items.movedAt))
      .limit(options.first);
  },

  withSeriesId: async ({ seriesId }) => {
    return db.select().from(items)
      .where(eq(items.seriesId, seriesId))
      .orderBy(asc(sql`(data->>'seasonNumber')::int`));
  },

  withExternalId: async ({ externalId }) => {
    const [item] = await db.select().from(items)
      .where(eq(items.externalId, externalId));
    return item ?? null;
  },

  // "Watching" category - hardcoded type grouping
  forWatching: async ({ first, after }) => {
    return db.select().from(items)
      .where(sql`type IN ('Feature', 'TvSeries')`)
      .orderBy(desc(items.movedAt))
      .limit(first)
      .offset(after ?? 0);
  }
};
```

**Mutate Implementation:**
```typescript
// packages/data/src/mutate.ts
export const Mutate = {
  createItem: async (itemData) => {
    const [created] = await db.insert(items)
      .values({
        ...itemData,
        movedAt: itemData.movedAt ?? new Date(),
        addedAt: itemData.addedAt ?? new Date()
      })
      .returning();
    return created;
  },

  updateItem: async ({ id, type, ...updates }) => {
    const updateData = { ...updates };
    if (updates.shelf) {
      updateData.movedAt = new Date();
    }

    const [updated] = await db.update(items)
      .set(updateData)
      .where(and(eq(items.type, type), eq(items.id, id)))
      .returning();
    return updated;
  },

  deleteItem: async ({ id, type }) => {
    await db.delete(items)
      .where(and(eq(items.type, type), eq(items.id, id)));
  }
};
```

#### 3b. GraphQL Layer Updates

**Files to modify:**
- `packages/graphql/src/resolvers/` - Minor updates
- `packages/graphql/src/shared/schema.ts` - Add new filter inputs

**Tasks:**
- [ ] Remove "cannot combine search and date" error check
- [ ] Add rating filter to GraphQL schema
- [ ] Update transform functions for new data structure
- [ ] Update error handling for PostgreSQL errors

**New GraphQL Types:**
```graphql
input ItemFilterInput {
  searchTerm: String
  startDate: DateTime
  endDate: DateTime
  minRating: Float
  sortBy: SortBy
}
```

#### 3c. Config Updates

**Files to modify:**
- `packages/config/src/` - Add DSQL connection config

**Tasks:**
- [ ] Add DSQL connection string config
- [ ] Update environment variable handling

---

### Phase 4: Testing & Verification

**Goal:** Ensure new implementation works correctly.

**Tasks:**
- [ ] Run existing snapshot tests against new data layer
- [ ] Fix any test failures
- [ ] Test all query types manually
- [ ] Test mutations (create, update, delete)
- [ ] Test TV series/season relationship queries
- [ ] Verify pagination works correctly
- [ ] Test new capabilities (combined search+date, rating filter)

---

### Phase 5: Deployment & Cutover

**Goal:** Deploy to production and switch traffic.

**Tasks:**
- [ ] Deploy DSQL cluster to production
- [ ] Run data migration on production data
- [ ] Deploy new code
- [ ] Verify production is working
- [ ] Monitor for errors

---

### Phase 6: Cleanup

**Goal:** Remove DynamoDB resources after successful migration.

**Files to modify:**
- `packages/cdk/src/BillioDataStack.ts` - Remove DynamoDB table and GSIs
- `packages/data/` - Remove Dynamoose dependency

**Tasks:**
- [ ] Keep DynamoDB running for 1-2 weeks as fallback
- [ ] Remove DynamoDB table from BillioDataStack
- [ ] Remove `itemTable` export and update dependent stacks
- [ ] Remove Dynamoose from dependencies
- [ ] Clean up old backup code (or update for DSQL)
- [ ] Update documentation

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| OCC retry needed | Add retry wrapper in data layer for transaction conflicts |
| Cold start latency | Connection pooling, keep-alive |
| Data migration errors | Run on test first, verify counts, spot-check records |
| DSQL feature gaps | Stick to basic SQL, test thoroughly |

---

## Files Summary

| Package | Changes |
|---------|---------|
| `packages/cdk/src/BillioDataStack.ts` | Add DSQL cluster alongside DynamoDB, eventually remove DynamoDB |
| `packages/cdk/src/BillioApiStack.ts` | Pass DSQL endpoint to Lambda environment |
| `packages/data/` | Complete rewrite: Dynamoose → Drizzle ORM |
| `packages/graphql/` | Minor updates: remove filter restrictions, add rating filter |
| `packages/backup/` | Add migration script |
| `packages/config/` | Add DSQL connection config |

---

## Progress Tracking

### Phase 1: Infrastructure
- [ ] DSQL cluster created
- [ ] IAM roles configured
- [ ] Lambda environment updated
- [ ] Test deployment successful

### Phase 2: Data Migration
- [ ] Migration script written
- [ ] Test migration successful
- [ ] Data verified

### Phase 3: Code Changes
- [ ] Drizzle schema defined
- [ ] Query object rewritten
- [ ] Mutate object rewritten
- [ ] GraphQL resolvers updated
- [ ] Config updated

### Phase 4: Testing
- [ ] Snapshot tests passing
- [ ] Manual testing complete
- [ ] New features verified

### Phase 5: Deployment
- [ ] Production DSQL deployed
- [ ] Production data migrated
- [ ] Production code deployed
- [ ] Production verified

### Phase 6: Cleanup
- [ ] DynamoDB retained for fallback period
- [ ] DynamoDB resources removed
- [ ] Dynamoose dependency removed
- [ ] Documentation updated

---

## Sources

- [Amazon Aurora DSQL - AWS](https://aws.amazon.com/rds/aurora/dsql/)
- [Aurora DSQL GA Announcement - AWS Blog](https://aws.amazon.com/blogs/aws/amazon-aurora-dsql-is-now-generally-available/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
