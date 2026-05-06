import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'bike-manager.db');

try {
  const db = new DatabaseSync(dbPath);
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
  
  console.log("\n📊 DATABASE TABLES:");
  console.log("------------------");
  tables.forEach(t => console.log(`- ${t.name}`));

  for (const table of tables) {
    if (table.name === 'sqlite_sequence') continue;
    
    const rows = db.prepare(`SELECT * FROM ${table.name} LIMIT 5`).all();
    console.log(`\n📄 DATA FROM: ${table.name.toUpperCase()} (Showing top 5)`);
    if (rows.length === 0) {
      console.log("(No data found)");
    } else {
      console.table(rows);
    }
  }
} catch (err: any) {
  console.error("❌ Error reading database:", err.message || err);
  console.log("Tip: Make sure you have added some data or completed the migration first!");
}
