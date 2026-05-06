/**
 * db.ts — SQLite database layer using Node.js built-in `node:sqlite`.
 * Available natively in Node v22.5+. No native compilation required.
 * Docs: https://nodejs.org/api/sqlite.html
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// On Railway, use /data volume for persistence. Locally, use ./data/
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? process.env.RAILWAY_VOLUME_MOUNT_PATH
  : path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'bike-manager.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for better performance and foreign key support
db.exec(`PRAGMA journal_mode = WAL;`);
db.exec(`PRAGMA foreign_keys = ON;`);

// ─── Run Migrations ───────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS bikes (
    id                  TEXT PRIMARY KEY,
    model               TEXT NOT NULL,
    bike_number         TEXT NOT NULL,
    color               TEXT,
    year_of_manufacture TEXT,
    status              TEXT NOT NULL DEFAULT 'In Stock',
    buying_date         TEXT NOT NULL,
    direct_cost         REAL NOT NULL DEFAULT 0,
    owner_name          TEXT,
    owner_nic           TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS additional_costs (
    id         TEXT PRIMARY KEY,
    bike_id    TEXT NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    label      TEXT,
    amount     REAL NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS bike_images (
    id         TEXT PRIMARY KEY,
    bike_id    TEXT NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
    category   TEXT NOT NULL,
    url        TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sales (
    id            TEXT PRIMARY KEY,
    bike_id       TEXT NOT NULL UNIQUE REFERENCES bikes(id) ON DELETE CASCADE,
    sold_date     TEXT NOT NULL,
    selling_price REAL NOT NULL DEFAULT 0,
    buyer_name    TEXT,
    buyer_contact TEXT,
    buyer_nic     TEXT,
    notes         TEXT
  );
`);

console.log(`✅ Database initialized at: ${dbPath}`);

export default db;
