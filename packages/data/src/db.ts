import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DsqlSigner } from "@aws-sdk/dsql-signer";
import * as schema from "./schema";

const endpoint = process.env.BILLIO_DSQL_ENDPOINT!;
const region = process.env.AWS_REGION || "us-east-1";

async function getAuthToken(): Promise<string> {
  const signer = new DsqlSigner({
    hostname: endpoint,
    region,
    expiresIn: 604800, // Token valid for 1 week (max supported by DSQL)
  });
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
