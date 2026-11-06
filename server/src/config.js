import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '../..');

// The whole project shares one root .env file. dotenv never overwrites values
// that were already provided by the process (useful for tests and deployments).
dotenv.config({ path: path.join(rootDir, '.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

const fallbackSecret = 'sweety-local-development-secret-change-me';
const jwtSecret = process.env.JWT_SECRET || fallbackSecret;
const insecureSecrets = new Set([
  fallbackSecret,
  'replace-me-with-a-long-random-string',
  'change-this-before-deploying',
]);

if (isProduction && (insecureSecrets.has(jwtSecret) || jwtSecret.length < 32)) {
  throw new Error(
    'JWT_SECRET must be set to a unique value of at least 32 characters in production.',
  );
}

function parseBoolean(value, fallback) {
  if (value === undefined) return fallback;
  return value === 'true';
}

const parsedBcryptRounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

export const config = {
  env: nodeEnv,
  isProduction,
  isTest,
  port: Number.parseInt(process.env.PORT || '4000', 10),
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://sweety:sweety@localhost:5433/sweety',
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret,
  cookieSecure: parseBoolean(process.env.COOKIE_SECURE, isProduction),
  bcryptRounds:
    Number.isInteger(parsedBcryptRounds) && parsedBcryptRounds >= 4
      ? parsedBcryptRounds
      : 12,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  publicDir: path.resolve(currentDir, '../public'),
  rootDir,
};
