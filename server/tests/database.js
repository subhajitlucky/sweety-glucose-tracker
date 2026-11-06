import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { pool } from '../src/db.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function databaseNameFromUrl(connectionString) {
  const url = new URL(connectionString);
  return decodeURIComponent(url.pathname.replace(/^\//, ''));
}

export async function ensureTestDatabase() {
  const connectionString = process.env.DATABASE_URL;
  const databaseName = databaseNameFromUrl(connectionString);

  const adminUrl = new URL(connectionString);
  adminUrl.pathname = '/postgres';

  const adminClient = new pg.Client({ connectionString: adminUrl.toString() });

  try {
    await adminClient.connect();
    const exists = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );

    if (exists.rowCount === 0) {
      const quotedName = `"${databaseName.replaceAll('"', '""')}"`;
      await adminClient.query(`CREATE DATABASE ${quotedName}`);
      console.log(`Created test database "${databaseName}".`);
    }
  } finally {
    await adminClient.end().catch(() => {});
  }
}

export async function resetTestSchema() {
  const schema = await fs.readFile(
    path.resolve(currentDir, '../db/schema.sql'),
    'utf8',
  );

  await pool.query('DROP TABLE IF EXISTS readings, users CASCADE');
  await pool.query(schema);
}

export async function truncateTables() {
  await pool.query('TRUNCATE TABLE readings, users RESTART IDENTITY CASCADE');
}
