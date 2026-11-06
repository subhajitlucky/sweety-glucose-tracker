import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

try {
  const schema = await fs.readFile(path.join(currentDir, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Database schema is up to date.');
} catch (error) {
  console.error('Could not apply the database schema.');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
