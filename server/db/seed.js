import bcrypt from 'bcrypt';
import { config } from '../src/config.js';
import { pool, withTransaction } from '../src/db.js';
import { toISODate } from '../src/utils/date.js';
import { SLOT_KEYS } from '../src/utils/readings.js';

const DEMO = {
  name: 'Sweety Demo',
  email: 'demo@sweety.app',
  password: 'Demo@1234',
};

const SLOT_BASES = {
  morning: 103,
  after_breakfast: 148,
  after_lunch: 137,
  after_dinner: 158,
};

function getDatesForMonth(year, month, lastDay) {
  const dates = [];
  for (let day = 1; day <= lastDay; day += 1) {
    dates.push(toISODate(year, month, day));
  }
  return dates;
}

function valueFor(dateString, slot, slotIndex) {
  const day = Number(dateString.slice(-2));
  const wobble = ((day * 7 + slotIndex * 13) % 39) - 19;
  const occasionalHigh = slot === 'after_dinner' && day % 9 === 0 ? 42 : 0;
  return Math.max(58, Math.min(290, SLOT_BASES[slot] + wobble + occasionalHigh));
}

function buildReadings(dates, { today, skipEvery = 0 } = {}) {
  const readings = [];

  for (const date of dates) {
    const day = Number(date.slice(-2));
    if (skipEvery && day % skipEvery === 0 && date !== today) {
      continue;
    }

    let slots = SLOT_KEYS;
    if (date === today) {
      // Leave dinner unlogged so the dashboard also demonstrates an open slot.
      slots = ['morning', 'after_breakfast', 'after_lunch'];
    }

    slots.forEach((slot, index) => {
      readings.push({ date, slot, value: valueFor(date, slot, index) });
    });
  }

  return readings;
}

async function seed() {
  const now = new Date();
  const today = toISODate(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const previousMonthStart = new Date(
    Date.UTC(now.getFullYear(), now.getMonth() - 1, 1),
  );
  const previousMonthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0));

  const previousDates = getDatesForMonth(
    previousMonthStart.getUTCFullYear(),
    previousMonthStart.getUTCMonth() + 1,
    previousMonthEnd.getUTCDate(),
  );
  const currentDates = getDatesForMonth(
    currentMonthStart.getUTCFullYear(),
    currentMonthStart.getUTCMonth() + 1,
    now.getDate(),
  );

  const readings = [
    ...buildReadings(previousDates, { skipEvery: 8 }),
    ...buildReadings(currentDates, { today, skipEvery: 6 }),
  ];

  const passwordHash = await bcrypt.hash(DEMO.password, config.bcryptRounds);

  await withTransaction(async (client) => {
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [DEMO.name, DEMO.email, passwordHash],
    );

    const userId = userResult.rows[0].id;
    await client.query('DELETE FROM readings WHERE user_id = $1', [userId]);

    for (const reading of readings) {
      await client.query(
        `INSERT INTO readings (user_id, reading_date, slot, value)
         VALUES ($1, $2, $3, $4)`,
        [userId, reading.date, reading.slot, reading.value],
      );
    }

    console.log(`Seeded ${readings.length} readings for ${DEMO.email}.`);
  });

  console.log(`Demo login: ${DEMO.email} / ${DEMO.password}`);
}

try {
  await seed();
} catch (error) {
  console.error('Seeding failed.');
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
