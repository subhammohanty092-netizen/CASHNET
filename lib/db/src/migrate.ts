import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const migrations = [
  ["0000_baseline", path.join(projectRoot, "database", "schema.sql")],
  ["20260827_phase1_foundation", path.join(projectRoot, "database", "migrations", "20260827_phase1_foundation.sql")],
  ["20260828_phase2_persistence_rbac", path.join(projectRoot, "database", "migrations", "20260828_phase2_persistence_rbac.sql")],
  ["20260829_phase3_provider_persistence", path.join(projectRoot, "database", "migrations", "20260829_phase3_provider_persistence.sql")],
  ["20260830_phase4_graph_tracing", path.join(projectRoot, "database", "migrations", "20260830_phase4_graph_tracing.sql")],
  ["20260831_phase5_intelligence", path.join(projectRoot, "database", "migrations", "20260831_phase5_intelligence.sql")],
  ["20260901_phase6_multichain", path.join(projectRoot, "database", "migrations", "20260901_phase6_multichain.sql")],
  ["20260901_phase6_risk", path.join(projectRoot, "database", "migrations", "20260901_phase6_risk.sql")],
  ["20260901_phase6_graph", path.join(projectRoot, "database", "migrations", "20260901_phase6_graph.sql")],
  ["20260901_phase6_defi", path.join(projectRoot, "database", "migrations", "20260901_phase6_defi.sql")],
  ["20260901_phase6_production", path.join(projectRoot, "database", "migrations", "20260901_phase6_production.sql")],
] as const;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to run migrations.");

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("create table if not exists cashnet_schema_migrations (id text primary key, applied_at timestamptz not null default now())");
  for (const [id, file] of migrations) {
    const applied = await client.query("select 1 from cashnet_schema_migrations where id = $1", [id]);
    if (applied.rowCount) continue;
    const sql = await readFile(file, "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into cashnet_schema_migrations (id) values ($1)", [id]);
      await client.query("commit");
      console.log(`Applied ${id}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} finally {
  await client.end();
}
