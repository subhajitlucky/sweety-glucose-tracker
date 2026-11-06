import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, '../../.env') });

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://sweety:sweety@localhost:5433/sweety_test';
process.env.JWT_SECRET = 'sweety-test-secret-not-used-outside-tests';
process.env.BCRYPT_ROUNDS = '4';
