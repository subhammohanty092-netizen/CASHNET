import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export type CashnetDatabase = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Creates the existing PostgreSQL/Drizzle access layer on demand. Keeping the
 * connection lazy lets the legacy synthetic demo start without a database.
 */
export function createDatabase(databaseUrl = process.env.DATABASE_URL): {
  pool: pg.Pool;
  db: CashnetDatabase;
} {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set before persistent API routes can be used.");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  return { pool, db: drizzle(pool, { schema }) };
}

let connection: ReturnType<typeof createDatabase> | undefined;

export function getDatabase(): ReturnType<typeof createDatabase> {
  connection ??= createDatabase();
  return connection;
}

export * from "./schema";
