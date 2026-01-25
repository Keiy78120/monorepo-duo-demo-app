/**
 * Export PostgreSQL data to JSON files for D1 import
 *
 * Usage: npx ts-node scripts/migration/export-postgres.ts
 *
 * Requires DATABASE_URL environment variable
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const EXPORT_DIR = path.join(__dirname, '../../data/export');

// Tables to export (in order for foreign key dependencies)
const TABLES = [
  'product_categories',
  'products',
  'pricing_tiers',
  'reviews',
  'drivers',
  'orders',
  'settings',
  'telegram_contacts',
];

async function exportTable(tableName: string): Promise<number> {
  console.log(`Exporting ${tableName}...`);

  const result = await pool.query(`SELECT * FROM "${tableName}"`);
  const rows = result.rows;

  // Convert PostgreSQL types to D1-compatible types
  const convertedRows = rows.map(row => {
    const converted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
      if (value === null) {
        converted[key] = null;
      } else if (typeof value === 'boolean') {
        // Boolean → Integer (0/1)
        converted[key] = value ? 1 : 0;
      } else if (value instanceof Date) {
        // Date → ISO 8601 string
        converted[key] = value.toISOString();
      } else if (Array.isArray(value)) {
        // Arrays → JSON string
        converted[key] = JSON.stringify(value);
      } else if (typeof value === 'object') {
        // JSONB → JSON string
        converted[key] = JSON.stringify(value);
      } else {
        converted[key] = value;
      }
    }

    return converted;
  });

  const filePath = path.join(EXPORT_DIR, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(convertedRows, null, 2));

  console.log(`  Exported ${rows.length} rows to ${filePath}`);
  return rows.length;
}

async function main() {
  console.log('PostgreSQL → D1 Export Script\n');

  // Create export directory
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }

  let totalRows = 0;

  for (const table of TABLES) {
    try {
      const count = await exportTable(table);
      totalRows += count;
    } catch (error) {
      console.error(`  Error exporting ${table}:`, error);
    }
  }

  console.log(`\nExport complete! Total: ${totalRows} rows`);
  console.log(`Files saved to: ${EXPORT_DIR}`);

  await pool.end();
}

main().catch(console.error);
