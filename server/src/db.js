import pg from 'pg';
import { config } from './config.js';

const { Pool, types } = pg;

// Keep PostgreSQL DATE values as YYYY-MM-DD strings instead of JavaScript Date
// objects. This avoids timezone-related off-by-one-day bugs in reports.
types.setTypeParser(1082, (value) => value);

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (error) => {
  // An idle client error should never bring down the API process.
  console.error('Unexpected PostgreSQL pool error', error);
});

export function query(text, params) {
  return pool.query(text, params);
}

/**
 * Runs a callback with a dedicated client inside a transaction.
 * ROLLBACK is always attempted if the callback throws.
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function healthCheck() {
  await pool.query('SELECT 1');
  return true;
}
