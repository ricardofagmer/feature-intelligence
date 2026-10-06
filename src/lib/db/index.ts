import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { mkdirSync } from "fs";
import { join } from "path";

/**
 * Singleton SQLite connection. Survives Next.js dev-server module reloads via
 * globalThis; schema is applied idempotently on first open.
 */

const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "app.db");

declare global {
  var __featureIntelDb: Database.Database | undefined;
}

function open(): Database.Database {
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const schema = readFileSync(join(process.cwd(), "src/lib/db/schema.sql"), "utf-8");
  db.exec(schema);
  return db;
}

export function getDb(): Database.Database {
  if (!globalThis.__featureIntelDb) {
    globalThis.__featureIntelDb = open();
  }
  return globalThis.__featureIntelDb;
}
