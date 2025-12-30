import { Pool, PoolClient } from "pg";
import { DsqlSigner } from "@aws-sdk/dsql-signer";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

interface AppliedMigration {
  name: string;
  applied_at: number;
}

/**
 * Custom migration runner for Aurora DSQL.
 *
 * Uses hand-crafted SQL files instead of Drizzle-generated migrations because:
 * 1. DSQL doesn't support SERIAL (used by Drizzle's tracking table)
 * 2. DSQL doesn't support partial indexes (WHERE clause)
 * 3. DSQL requires CREATE INDEX ASYNC for all index creation
 *
 * Migration files are read directly from migrations/ directory, sorted by filename.
 * Each statement is executed individually (autocommit) to avoid transaction issues.
 */

async function ensureMigrationsTable(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_billio_migrations" (
      name TEXT PRIMARY KEY,
      applied_at BIGINT NOT NULL
    )
  `);
}

async function getAppliedMigrations(client: PoolClient): Promise<Set<string>> {
  const result = await client.query<AppliedMigration>(
    `SELECT name, applied_at FROM "_billio_migrations"`,
  );
  return new Set(result.rows.map((row) => row.name));
}

async function recordMigration(
  client: PoolClient,
  name: string,
  appliedAt: number,
) {
  await client.query(
    `INSERT INTO "_billio_migrations" (name, applied_at) VALUES ($1, $2)`,
    [name, appliedAt],
  );
}

function getMigrationFiles(migrationsFolder: string): string[] {
  return readdirSync(migrationsFolder)
    .filter((f) => f.endsWith(".sql"))
    .sort();
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

    // Read all migration files from the migrations directory
    const migrationsFolder = join(__dirname, "..", "migrations");
    const migrationFiles = getMigrationFiles(migrationsFolder);

    // Apply any new migrations
    let appliedCount = 0;
    for (const filename of migrationFiles) {
      const name = filename.replace(".sql", "");

      if (appliedMigrations.has(name)) {
        console.log(`Skipping already applied migration: ${name}`);
        continue;
      }

      console.log(`Applying migration: ${name}`);

      // Read the migration SQL
      const sqlPath = join(migrationsFolder, filename);
      const sql = readFileSync(sqlPath, "utf-8");

      // Split by semicolon followed by newline and execute each statement
      const statements = sql
        .split(/;\s*\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const statement of statements) {
        console.log(`  Executing: ${statement.substring(0, 60)}...`);
        const result = await client.query(statement);

        // Handle CREATE INDEX ASYNC - wait for the job to complete
        if (statement.toUpperCase().includes("CREATE INDEX ASYNC")) {
          const jobId = result.rows[0]?.job_id;
          if (jobId) {
            console.log(`  Waiting for async index job ${jobId}...`);
            const waitResult = await client.query<{ wait_for_job: boolean }>(
              `SELECT sys.wait_for_job($1) as wait_for_job`,
              [jobId],
            );
            if (!waitResult.rows[0]?.wait_for_job) {
              throw new Error(`Async index job ${jobId} failed`);
            }
            console.log(`  Async index job ${jobId} completed`);
          }
        }
      }

      // Record the migration as applied
      await recordMigration(client, name, Date.now());
      appliedCount++;
      console.log(`Applied migration: ${name}`);
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
