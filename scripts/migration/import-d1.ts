/**
 * Import JSON data to D1 database
 *
 * Usage: npx ts-node scripts/migration/import-d1.ts
 *
 * This script generates SQL INSERT statements from exported JSON files
 * Run the generated SQL using: wrangler d1 execute vhash-prod --file=./data/import.sql
 */

import * as fs from 'fs';
import * as path from 'path';

const EXPORT_DIR = path.join(__dirname, '../../data/export');
const IMPORT_FILE = path.join(__dirname, '../../data/import.sql');

// Tables to import (in order for foreign key dependencies)
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

function escapeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    // Escape single quotes by doubling them
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function generateInsert(tableName: string, row: Record<string, unknown>): string {
  const columns = Object.keys(row);
  const values = columns.map(col => escapeValue(row[col]));

  return `INSERT OR IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
}

function importTable(tableName: string): string[] {
  const filePath = path.join(EXPORT_DIR, `${tableName}.json`);

  if (!fs.existsSync(filePath)) {
    console.log(`  Skipping ${tableName} (no export file)`);
    return [];
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>[];
  console.log(`  Processing ${tableName}: ${data.length} rows`);

  const statements: string[] = [];
  statements.push(`-- ${tableName}`);

  for (const row of data) {
    statements.push(generateInsert(tableName, row));
  }

  statements.push('');
  return statements;
}

function main() {
  console.log('D1 Import Script - Generating SQL\n');

  if (!fs.existsSync(EXPORT_DIR)) {
    console.error('Export directory not found. Run export-postgres.ts first.');
    process.exit(1);
  }

  const allStatements: string[] = [
    '-- D1 Import Script',
    '-- Generated from PostgreSQL export',
    `-- Generated at: ${new Date().toISOString()}`,
    '',
    '-- Disable foreign keys during import',
    'PRAGMA foreign_keys = OFF;',
    '',
  ];

  for (const table of TABLES) {
    const statements = importTable(table);
    allStatements.push(...statements);
  }

  allStatements.push('-- Re-enable foreign keys');
  allStatements.push('PRAGMA foreign_keys = ON;');

  fs.writeFileSync(IMPORT_FILE, allStatements.join('\n'));

  console.log(`\nSQL file generated: ${IMPORT_FILE}`);
  console.log('\nTo import to D1, run:');
  console.log('  wrangler d1 execute vhash-prod --file=./data/import.sql');
}

main();
