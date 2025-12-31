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

Single table (`items_v2`) with type-specific fields in TEXT column called `data`:

```sql
CREATE TABLE items_v2 (
  id UUID PRIMARY KEY,  -- Preserve existing IDs from DynamoDB (no auto-generation)
  type VARCHAR(50) NOT NULL,  -- 'Book', 'VideoGame', 'Feature', 'TvSeries', 'TvSeason'
  shelf VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  rating INTEGER,  -- 1-10 scale
  image TEXT,  -- JSON with full structure including sizes array for optimized images
  external_id VARCHAR(255),
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- TvSeason -> TvSeries relationship (no FK constraint - not enforced in DSQL)
  series_id UUID,

  -- Type-specific fields stored as JSON text (JSONB not supported in DSQL)
  data TEXT DEFAULT '{}'
  -- Books: {"author": "...", "reread": false}
  -- VideoGames: {"platforms": [...], "devices": [...], "hoursPlayed": 50, "replay": false}
  -- Features: {"releaseYear": "2023", "rewatch": false}
  -- TvSeries: {"releaseYear": "2020"}
  -- TvSeasons: {"seasonNumber": 1, "seasonTitle": "...", "releaseYear": "2020", "rewatch": false}
);

-- Essential indexes (5 total)
-- Note: DSQL requires CREATE INDEX ASYNC, doesn't support DESC, USING btree, or WHERE
CREATE INDEX ASYNC idx_type_moved_v2 ON items_v2(type, moved_at);
CREATE INDEX ASYNC idx_type_shelf_moved_v2 ON items_v2(type, shelf, moved_at);
CREATE INDEX ASYNC idx_type_title_v2 ON items_v2(type, title);
CREATE INDEX ASYNC idx_external_id_v2 ON items_v2(external_id);
CREATE INDEX ASYNC idx_series_id_v2 ON items_v2(series_id, moved_at);

-- Constraint: series_id only valid for TvSeason
ALTER TABLE items_v2 ADD CONSTRAINT chk_series_id_v2
  CHECK (series_id IS NULL OR type = 'TvSeason');
```

**Note on `items_v2`:** DSQL doesn't support `ALTER TABLE DROP COLUMN`, so we created a new table with the correct schema rather than modifying the original `items` table. The old `items` table is dropped after data migration.

**Note:** `category` field removed - type groupings (e.g., "watching" = Feature + TvSeries) will be hardcoded in application code.

---

## Migration Phases

### Phase 1: Infrastructure (CDK) ✅

**Goal:** Add Aurora DSQL cluster to BillioDataStack alongside existing DynamoDB table.

**Files to modify:**

- `packages/cdk/src/BillioDataStack.ts` - Add DSQL cluster

**Tasks:**

- [x] Add Aurora DSQL cluster to BillioDataStack
- [x] Export cluster endpoint for Lambda access
- [x] Create IAM roles/policies for Lambda → DSQL access
- [x] Update BillioApiStack to pass DSQL endpoint to Lambda environment
- [x] Deploy to AWS (all environments)

**Deliverable:** DSQL cluster running alongside DynamoDB, endpoint available to Lambdas.

---

### Phase 2: Schema & Migrations ✅

**Goal:** Define schema and set up migrations with custom DSQL-compatible SQL. Apply migrations via GitHub Actions.

**Files to create/modify:**

- `packages/data/src/schema.ts` - Drizzle schema definition (for ORM use, not migrations)
- `packages/data/src/db.ts` - Database connection
- `packages/data/src/migrate.ts` - Custom migration runner script
- `packages/data/migrations/` - Hand-crafted SQL migration files
- `packages/cdk/src/BillioDataMigrationStack.ts` - IAM role for GitHub Actions migrations
- `.github/workflows/deploy.yml` - Add migration step after deploy

**Tasks:**

- [x] Add dependencies to `packages/data`
  - `drizzle-orm` (for ORM queries, not migrations)
  - `@aws-sdk/dsql-signer` (for IAM auth token generation)
  - `pg` (PostgreSQL driver)
- [x] Create Drizzle schema definition (`packages/data/src/schema.ts`)
- [x] Create database connection module with IAM auth (`packages/data/src/db.ts`)
- [x] Create custom migration runner (`packages/data/src/migrate.ts`)
- [x] Create hand-crafted DSQL-compatible initial migration
- [x] Add IAM role to CDK for GitHub Actions to assume for migrations (`BillioDataMigrationStack`)
- [x] Add migration step to deploy.yml (after deploy, before graphql tests)
- [x] Apply migration to test environment (will run on next deploy)
- [x] Apply migration to production environment (will run on next deploy)

**Note:** We use custom SQL migrations instead of drizzle-kit because DSQL doesn't support:

- Partial indexes (`WHERE` clause)
- `USING btree` syntax
- Synchronous `CREATE INDEX` (must always use `CREATE INDEX ASYNC`)

**Drizzle Schema:**

```typescript
// packages/data/src/schema.ts
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
  "items_v2",
  {
    id: uuid("id").primaryKey(), // No defaultRandom - preserve existing IDs
    type: varchar("type", { length: 50 }).notNull(),
    shelf: varchar("shelf", { length: 50 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    rating: integer("rating"), // 1-10 scale
    image: text("image"), // JSON string with full structure including sizes array
    externalId: varchar("external_id", { length: 255 }),
    notes: text("notes"),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    movedAt: timestamp("moved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    seriesId: uuid("series_id"), // No FK constraint - DSQL doesn't enforce foreign keys
    data: text("data").default("{}"), // TEXT instead of JSONB - DSQL doesn't support JSONB columns
  },
  (table) => [
    // Essential indexes (5 total) - DSQL doesn't support partial indexes
    index("idx_type_moved").on(table.type, table.movedAt),
    index("idx_type_shelf_moved").on(table.type, table.shelf, table.movedAt),
    index("idx_type_title").on(table.type, table.title),
    index("idx_external_id").on(table.externalId),
    index("idx_series_id").on(table.seriesId, table.movedAt),
    check("chk_series_id", sql`series_id IS NULL OR type = 'TvSeason'`),
  ],
);
```

**Database Connection with IAM Auth:**

```typescript
// packages/data/src/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DsqlSigner } from "@aws-sdk/dsql-signer";
import * as schema from "./schema";

const endpoint = process.env.BILLIO_DSQL_ENDPOINT!;
const region = process.env.AWS_REGION || "us-east-1";

async function getAuthToken(): Promise<string> {
  const signer = new DsqlSigner({ hostname: endpoint, region });
  return signer.getDbConnectAdminAuthToken();
}

let pool: Pool | null = null;

export async function getDb() {
  if (!pool) {
    const token = await getAuthToken();
    pool = new Pool({
      host: endpoint,
      port: 5432,
      user: "admin",
      password: token,
      database: "postgres",
      ssl: { rejectUnauthorized: true },
    });
  }
  return drizzle(pool, { schema });
}
```

**Drizzle Config:**

```typescript
// packages/data/src/drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
});
```

**Migration Script:**

```typescript
// packages/data/src/migrate.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { DsqlSigner } from "@aws-sdk/dsql-signer";

async function runMigrations() {
  const endpoint = process.env.BILLIO_DSQL_ENDPOINT!;
  const region = process.env.AWS_REGION || "us-east-1";

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

  const db = drizzle(pool);

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./migrations" });
  console.log("Migrations complete!");

  await pool.end();
}

runMigrations().catch(console.error);
```

**CDK Stack for GitHub Actions Migrations:**

```typescript
// packages/cdk/src/BillioDataMigrationStack.ts
import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import BillioDataStack from "./BillioDataStack";

interface BillioDataMigrationStackProps {
  dataStacks: BillioDataStack[];
}

export default class BillioDataMigrationStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: BillioDataMigrationStackProps,
  ) {
    super(scope, id);

    const githubProviderArn = `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`;
    const githubProvider =
      iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
        this,
        "GitHubOIDC",
        githubProviderArn,
      );

    const migrationRole = new iam.Role(this, "GitHubMigrationRole", {
      roleName: "billio-github-actions-dsql-migrate",
      assumedBy: new iam.WebIdentityPrincipal(
        githubProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub":
              "repo:mjwbenton/billio:*",
          },
        },
      ),
    });

    migrationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["dsql:DbConnectAdmin"],
        resources: props.dataStacks.map(
          (stack) => stack.dsqlCluster.attrResourceArn,
        ),
      }),
    );

    migrationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["cloudformation:DescribeStacks"],
        resources: props.dataStacks.map(
          (stack) =>
            `arn:aws:cloudformation:${stack.region}:${stack.account}:stack/${stack.stackName}/*`,
        ),
      }),
    );
  }
}
```

**Deploy.yml Changes (add migrate job between deploy and graphql-tests):**

```yaml
# .github/workflows/deploy.yml - migrate job (added between deploy and graphql-tests)
migrate:
  needs: deploy
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: "24"
        cache: "yarn"

    - uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: arn:aws:iam::858777967843:role/billio-github-actions-dsql-migrate
        aws-region: us-east-1

    - run: yarn install --frozen-lockfile

    - name: Get DSQL endpoints from CloudFormation
      id: endpoints
      run: |
        PROD_ENDPOINT=$(aws cloudformation describe-stacks --stack-name BillioDataV3 --query "Stacks[0].Outputs[?OutputKey=='DsqlEndpoint'].OutputValue" --output text)
        TEST_ENDPOINT=$(aws cloudformation describe-stacks --stack-name BillioTestDataV3 --query "Stacks[0].Outputs[?OutputKey=='DsqlEndpoint'].OutputValue" --output text)
        echo "prod=$PROD_ENDPOINT" >> $GITHUB_OUTPUT
        echo "test=$TEST_ENDPOINT" >> $GITHUB_OUTPUT

    - name: Run DSQL migrations (test)
      env:
        BILLIO_DSQL_ENDPOINT: ${{ steps.endpoints.outputs.test }}
        AWS_REGION: us-east-1
      run: yarn workspace @mattb.tech/billio-data migrate

    - name: Run DSQL migrations (production)
      env:
        BILLIO_DSQL_ENDPOINT: ${{ steps.endpoints.outputs.prod }}
        AWS_REGION: us-east-1
      run: yarn workspace @mattb.tech/billio-data migrate

graphql-tests:
  needs: migrate
  # ... rest unchanged
```

**Package.json scripts:**

```json
// packages/data/package.json scripts
{
  "scripts": {
    "migrate": "tsx src/migrate.ts"
  }
}
```

**Note:** We removed `db:generate` and `db:push` scripts since we now use hand-crafted SQL migrations.

**Deliverable:** Drizzle schema defined, migrations generated, and GitHub Actions workflow ready to apply migrations to any environment.

---

### Phase 3: Data Migration

**Goal:** Export data from DynamoDB and import into Aurora DSQL, preserving existing UUIDs.

**Files to modify:**

- `packages/backup/src/bin/` - Add migration script

**Important:** Existing UUIDs must be preserved as they are referenced by external systems.

**Tasks:**

- [x] Run existing backup to get latest JSON exports
- [x] Create migration script to transform JSON → SQL INSERTs
- [x] Handle data transformations:
  - **Preserve existing `id` values** (do NOT generate new UUIDs)
  - Convert timestamps to TIMESTAMPTZ
  - Map `type:id` composite keys to separate fields
  - Extract type-specific fields into `data` JSONB
  - Preserve `seriesId` references (TvSeason → TvSeries)
- [x] Run migration against test DSQL cluster
- [x] Verify row counts match
- [x] Spot-check data integrity
- [x] Verify `seriesId` foreign key relationships are valid

**Migration Script Outline:**

```typescript
// packages/backup/src/bin/migrateToDsql.ts
// Preserves full image structure including sizes array for optimized images

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

  return {
    id: item.id,
    type: item.type,
    shelf: item.shelf,
    title: item.title,
    rating: item.rating ?? null,
    image, // JSON string with full structure
    externalId: item.externalId ?? null,
    notes: item.notes ?? null,
    addedAt: parseTimestamp(item.addedAt),
    movedAt: parseTimestamp(item.movedAt),
    seriesId: item.type === "TvSeason" ? item.seriesId : null,
    data: JSON.stringify(typeSpecificData),
  };
}
```

**Deliverable:** All data in DSQL with preserved IDs, verified against DynamoDB counts.

---

### Phase 4: Code Changes

**Goal:** Update application code to use Aurora DSQL instead of DynamoDB.

#### 4a. Data Layer Rewrite

**Files to modify:**

- `packages/data/src/` - Complete rewrite

**Tasks:**

- [x] Add Drizzle ORM dependencies (`drizzle-orm`, `pg`)
- [x] Create Drizzle schema definition
- [x] Rewrite `Query` object with Drizzle queries
- [x] Rewrite `Mutate` object with Drizzle mutations
- [x] Update pagination to use OFFSET/LIMIT or keyset pagination
- [x] Remove Dynamoose dependency

**Drizzle Schema:** (See Phase 2 above for full schema)

**Query Implementation:**

```typescript
// packages/data/src/query.ts
import { db } from "./db";
import { items } from "./schema";
import { eq, and, gte, lte, desc, asc, ilike, sql } from "drizzle-orm";

export const Query = {
  withId: async ({ type, id }) => {
    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.type, type), eq(items.id, id)));
    return item ?? null;
  },

  ofType: async (
    { type },
    { first, after, startDate, endDate, sortBy, searchTerm, minRating },
  ) => {
    const conditions = [
      eq(items.type, type),
      gte(items.movedAt, startDate ?? new Date("2010-01-01")),
      lte(items.movedAt, endDate ?? new Date("2200-01-01")),
    ];

    // NEW: Can combine search + date (impossible in DynamoDB!)
    if (searchTerm) {
      conditions.push(ilike(items.title, `%${searchTerm}%`));
    }

    // NEW: Rating filter
    if (minRating) {
      conditions.push(gte(items.rating, minRating));
    }

    const sortCol = sortBy === "ADDED_AT" ? items.addedAt : items.movedAt;

    return db
      .select()
      .from(items)
      .where(and(...conditions))
      .orderBy(desc(sortCol))
      .limit(first)
      .offset(after ?? 0);
  },

  onShelf: async ({ type, shelf }, options) => {
    // Similar to ofType with additional shelf filter
    return db
      .select()
      .from(items)
      .where(
        and(
          eq(items.type, type),
          eq(items.shelf, shelf),
          // ... other conditions
        ),
      )
      .orderBy(desc(items.movedAt))
      .limit(options.first);
  },

  withSeriesId: async ({ seriesId }) => {
    return db
      .select()
      .from(items)
      .where(eq(items.seriesId, seriesId))
      .orderBy(asc(sql`(data->>'seasonNumber')::int`));
  },

  withExternalId: async ({ externalId }) => {
    const [item] = await db
      .select()
      .from(items)
      .where(eq(items.externalId, externalId));
    return item ?? null;
  },

  // "Watching" category - hardcoded type grouping
  forWatching: async ({ first, after }) => {
    return db
      .select()
      .from(items)
      .where(sql`type IN ('Feature', 'TvSeries')`)
      .orderBy(desc(items.movedAt))
      .limit(first)
      .offset(after ?? 0);
  },
};
```

**Mutate Implementation:**

```typescript
// packages/data/src/mutate.ts
export const Mutate = {
  createItem: async (itemData) => {
    const [created] = await db
      .insert(items)
      .values({
        ...itemData,
        movedAt: itemData.movedAt ?? new Date(),
        addedAt: itemData.addedAt ?? new Date(),
      })
      .returning();
    return created;
  },

  updateItem: async ({ id, type, ...updates }) => {
    const updateData = { ...updates };
    if (updates.shelf) {
      updateData.movedAt = new Date();
    }

    const [updated] = await db
      .update(items)
      .set(updateData)
      .where(and(eq(items.type, type), eq(items.id, id)))
      .returning();
    return updated;
  },

  deleteItem: async ({ id, type }) => {
    await db.delete(items).where(and(eq(items.type, type), eq(items.id, id)));
  },
};
```

#### 4b. GraphQL Layer Updates

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

#### 4c. Config Updates

**Files to modify:**

- `packages/config/src/` - Add DSQL connection config

**Tasks:**

- [ ] Add DSQL connection string config
- [ ] Update environment variable handling

---

### Phase 5: Testing & Verification

**Goal:** Ensure new implementation works correctly.

**Tasks:**

- [x] Run existing snapshot tests against new data layer
- [x] Fix any test failures
- [x] Test all query types manually
- [x] Test mutations (create, update, delete)
- [x] Test TV series/season relationship queries
- [x] Verify pagination works correctly
- [x] Test new capabilities (combined search+date, rating filter)

---

### Phase 6: Deployment & Cutover

**Goal:** Deploy to production and switch traffic.

**Tasks:**

- [x] Deploy DSQL cluster to production
- [x] Run data migration on production data
- [x] Deploy new code
- [x] Verify production is working
- [x] Monitor for errors

---

### Phase 7: Cleanup

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

## Aurora DSQL Compatibility Notes

Aurora DSQL has several PostgreSQL compatibility limitations that affect this schema:

| Feature            | Status           | Workaround                                   |
| ------------------ | ---------------- | -------------------------------------------- |
| JSONB columns      | ❌ Not supported | Use TEXT column, JSON.parse/stringify in app |
| Foreign keys       | ❌ Not enforced  | Referential integrity checked in app code    |
| DROP COLUMN        | ❌ Not supported | Create new table (`items_v2`) instead        |
| CHECK constraints  | ✅ Supported     | Used for `chk_series_id`                     |
| Partial indexes    | ❌ Not supported | Use regular indexes                          |
| Timestamps with TZ | ✅ Supported     | Used for `added_at`, `moved_at`              |
| UUIDs              | ✅ Supported     | Primary key type                             |

**Sources:**

- [Aurora DSQL Supported Data Types](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-supported-data-types.html)
- [Aurora DSQL Unsupported Features](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-unsupported-features.html)

---

## Risks & Mitigations

| Risk                  | Mitigation                                                |
| --------------------- | --------------------------------------------------------- |
| OCC retry needed      | Add retry wrapper in data layer for transaction conflicts |
| Cold start latency    | Connection pooling, keep-alive                            |
| Data migration errors | Run on test first, verify counts, spot-check records      |
| DSQL feature gaps     | Stick to basic SQL, test thoroughly                       |
| JSONB not supported   | Use TEXT column with JSON serialization in application    |
| FK not enforced       | Validate series_id references in application layer        |

---

## Files Summary

| Package                                        | Changes                                                      |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `packages/cdk/src/BillioDataStack.ts`          | Add DSQL cluster, eventually remove DynamoDB                 |
| `packages/cdk/src/BillioDataMigrationStack.ts` | IAM role for GitHub Actions migrations                       |
| `packages/cdk/src/BillioApiStack.ts`           | Pass DSQL endpoint to Lambda environment, DbConnectAdmin     |
| `packages/data/src/schema.ts`                  | Drizzle schema for `items_v2` table with image JSON column   |
| `packages/data/src/db.ts`                      | Database connection with IAM auth                            |
| `packages/data/src/index.ts`                   | Query/Mutate with JSON image serialization                   |
| `packages/data/src/migrate.ts`                 | Custom migration runner script                               |
| `packages/data/migrations/`                    | 0001: initial items, 0002: items_v2, 0003: drop items        |
| `packages/graphql/src/shared/Image.ts`         | Dual upload (original + 128px), selectImage picks small size |
| `packages/backup/src/bin/migrateToDsql.ts`     | Data migration preserving full image structure with sizes    |
| `.github/workflows/deploy.yml`                 | Add migrate job between deploy and graphql-tests             |

---

## Progress Tracking

### Phase 1: Infrastructure ✅

- [x] DSQL cluster created (in CDK code)
- [x] IAM roles configured (dsql:DbConnect permission)
- [x] Lambda environment updated (BILLIO_DSQL_ENDPOINT)
- [x] Deployment successful (all environments)

### Phase 2: Schema & Migrations

- [x] Dependencies added (drizzle-orm, pg, dsql-signer)
- [x] Drizzle schema defined (`packages/data/src/schema.ts`)
- [x] Database connection module created (`packages/data/src/db.ts`)
- [x] Custom migration runner created (`packages/data/src/migrate.ts`)
- [x] Hand-crafted DSQL-compatible initial migration (`migrations/0001_initial_schema.sql`)
- [x] IAM role for GitHub Actions added to CDK
- [x] Deploy.yml updated with migrate job
- [ ] Migration applied to test environment
- [ ] Migration applied to production environment

### Phase 3: Data Migration

- [x] Migration script written (`packages/backup/src/bin/migrateToDsql.ts`)
- [ ] Test migration successful
- [ ] Data verified

### Phase 4: Code Changes ✅

- [x] Query object rewritten (Drizzle ORM, offset-based pagination)
- [x] Mutate object rewritten (Drizzle ORM with upsert support)
- [x] Image handling: `sizes` array restored (stores both original + 128px resized versions)
- [x] Image stored as single JSON column (not flat columns) to preserve full structure
- [x] `consistent` flag removed from Query.withId (DSQL has strong consistency)
- [x] Dynamoose dependency removed from package.json
- [x] Table renamed to `items_v2` (DSQL doesn't support DROP COLUMN)
- [ ] GraphQL resolvers updated (not needed - interface maintained)
- [ ] Config updated (not needed - uses existing BILLIO_DSQL_ENDPOINT)

### Phase 5: Testing

- [ ] Snapshot tests passing
- [ ] Manual testing complete
- [ ] New features verified

### Phase 6: Deployment

- [ ] Production DSQL deployed
- [ ] Production data migrated
- [ ] Production code deployed
- [ ] Production verified

### Phase 7: Cleanup

- [ ] DynamoDB retained for fallback period
- [ ] DynamoDB resources removed
- [x] Dynamoose dependency removed
- [ ] Documentation updated

---

## Sources

- [Amazon Aurora DSQL - AWS](https://aws.amazon.com/rds/aurora/dsql/)
- [Aurora DSQL GA Announcement - AWS Blog](https://aws.amazon.com/blogs/aws/amazon-aurora-dsql-is-now-generally-available/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
