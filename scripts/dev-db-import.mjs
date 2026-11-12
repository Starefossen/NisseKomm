#!/usr/bin/env node
// One-time move of `mise run dev`'s file store into local Postgres, through
// the same Store code the server uses. Idempotent: lists merge, existing
// sessions are skipped. Run via jiti (mise run dev:db-import) so db.ts loads.
import fs from "node:fs";
import { Pool } from "pg";
import { createPgStore, migrate } from "../src/lib/db";

const file = process.env.DEV_STORE_FILE ?? ".data/dev-store.json";
if (!fs.existsSync(file)) {
  console.log(`${file} finnes ikke – ingenting å importere`);
  process.exit(0);
}
const dump = JSON.parse(fs.readFileSync(file, "utf8"));
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await migrate(pool);
const store = createPgStore(pool);
let s = 0;
for (const [hash, sess] of dump.sessions ?? [])
  if (sess.expires > Date.now() && !(await store.getSession(hash))) {
    await store.setSession(hash, sess);
    s++;
  }
for (const [k, v] of dump.kv ?? []) await store.putState(k, v);
console.log(`importerte ${s} økter og ${(dump.kv ?? []).length} nøkler`);
await pool.end();
