import { Pool, PoolClient } from "pg";
import { DsqlSigner } from "@aws-sdk/dsql-signer";
import { readFileSync } from "fs";
import { join } from "path";

interface MigrationJournal {
  entries: Array<{
    idx: number;
    tag: string;
    when: number;
  }>;
}

interface AppliedMigration {
  hash: string;
  applied_at: number;
}

/**
 * Custom migration runner for Aurora DSQL.
 *
 * Drizzle's built-in migrator is incompatible with DSQL for two reasons:
 * 1. It uses SERIAL for its tracking table, but DSQL doesn't support sequences
 * 2. It may mix DDL and DML in the same transaction, but DSQL forbids this
 *
 * This custom runner avoids both issues by:
 * - Using a simple TEXT primary key instead of SERIAL
 * - Relying on autocommit so each statement is its own transaction
 */

async function ensureMigrationsTable(client: PoolClient) {
  // Create the table with a hash-based primary key (no SERIAL needed)
  // Uses custom table name to distinguish from Drizzle's built-in migrator
  // which uses SERIAL (incompatible with DSQL)
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_billio_migrations" (
      hash TEXT PRIMARY KEY,
      applied_at BIGINT NOT NULL
    )
  `);
}

async function getAppliedMigrations(client: PoolClient): Promise<Set<string>> {
  const result = await client.query<AppliedMigration>(
    `SELECT hash, applied_at FROM "_billio_migrations"`,
  );
  return new Set(result.rows.map((row) => row.hash));
}

async function recordMigration(
  client: PoolClient,
  hash: string,
  appliedAt: number,
) {
  await client.query(
    `INSERT INTO "_billio_migrations" (hash, applied_at) VALUES ($1, $2)`,
    [hash, appliedAt],
  );
}

async function runMigrations() {
  const endpoint = process.env.BILLIO_DSQL_ENDPOINT!;
  const region = process.env.AWS_REGION || "us-east-1";

  if (!endpoint) {
    throw new Error("BILLIO_DSQL_ENDPOINT environment variable is required");
  }

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

  const client = await pool.connect();

  try {
    console.log("Running migrations...");

    // Ensure migrations table exists
    await ensureMigrationsTable(client);

    // Get already applied migrations
    const appliedMigrations = await getAppliedMigrations(client);
    console.log(`Found ${appliedMigrations.size} already applied migrations`);

    // Read the journal to find all migrations
    const migrationsFolder = join(__dirname, "..", "migrations");
    const journalPath = join(migrationsFolder, "meta", "_journal.json");
    const journal: MigrationJournal = JSON.parse(
      readFileSync(journalPath, "utf-8"),
    );

    // Apply any new migrations
    let appliedCount = 0;
    for (const entry of journal.entries) {
      const hash = entry.tag;

      if (appliedMigrations.has(hash)) {
        console.log(`Skipping already applied migration: ${hash}`);
        continue;
      }

      console.log(`Applying migration: ${hash}`);

      // Read the migration SQL
      const sqlPath = join(migrationsFolder, `${hash}.sql`);
      const sql = readFileSync(sqlPath, "utf-8");

      // Split by statement breakpoint marker and execute each statement
      const statements = sql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await client.query(statement);
      }

      // Record the migration as applied
      await recordMigration(client, hash, Date.now());
      appliedCount++;
      console.log(`Applied migration: ${hash}`);
    }

    if (appliedCount === 0) {
      console.log("No new migrations to apply");
    } else {
      console.log(`Applied ${appliedCount} migration(s)`);
    }

    console.log("Migrations complete!");
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
