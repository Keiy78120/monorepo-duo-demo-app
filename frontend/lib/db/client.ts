import { Pool } from "pg";

// PostgreSQL connection pool
const useSsl = process.env.DB_SSL === "true";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: true } : false,
});

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await pool.query(text, params);
  return (result.rows[0] as T) || null;
}

export async function execute(
  text: string,
  params?: unknown[]
): Promise<number> {
  const result = await pool.query(text, params);
  return result.rowCount || 0;
}

export { pool };
