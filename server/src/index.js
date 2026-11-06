import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Sweety API listening on http://localhost:${config.port}`);
});

async function shutdown(signal) {
  console.log(`\n${signal} received. Closing the server…`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });

  // Do not let an open request block shutdown forever.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
