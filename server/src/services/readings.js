import { query, withTransaction } from '../db.js';
import { HttpError } from '../utils/httpError.js';
import {
  mapReading,
  SLOT_SHORT_LABELS,
  SLOT_SQL_ORDER,
} from '../utils/readings.js';

function duplicateMessage(slot) {
  const article = slot.startsWith('after_') ? 'an' : 'a';
  return `You already have ${article} ${SLOT_SHORT_LABELS[slot]} reading for this date.`;
}

function maxReadingsMessage() {
  return 'You can add only 4 readings per day.';
}

async function lockUser(client, userId) {
  await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
}

export async function listReadings(userId, page, limit) {
  const offset = (page - 1) * limit;

  const [countResult, readingsResult] = await Promise.all([
    query('SELECT COUNT(*)::int AS total FROM readings WHERE user_id = $1', [userId]),
    query(
      `SELECT id, reading_date AS date, slot, value, created_at, updated_at
       FROM readings
       WHERE user_id = $1
       ORDER BY reading_date DESC, ${SLOT_SQL_ORDER}
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    ),
  ]);

  const total = countResult.rows[0].total;

  return {
    readings: readingsResult.rows.map(mapReading),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getReading(userId, id) {
  const result = await query(
    `SELECT id, reading_date AS date, slot, value, created_at, updated_at
     FROM readings
     WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );

  if (result.rowCount === 0) {
    throw new HttpError(404, 'Reading not found.');
  }

  return mapReading(result.rows[0]);
}

export async function createReading(userId, input) {
  try {
    return await withTransaction(async (client) => {
      // Locking the user's row serialises simultaneous creates for one account.
      await lockUser(client, userId);

      const countResult = await client.query(
        'SELECT COUNT(*)::int AS total FROM readings WHERE user_id = $1 AND reading_date = $2',
        [userId, input.date],
      );

      if (countResult.rows[0].total >= 4) {
        throw new HttpError(409, maxReadingsMessage());
      }

      const duplicateResult = await client.query(
        `SELECT id FROM readings
         WHERE user_id = $1 AND reading_date = $2 AND slot = $3`,
        [userId, input.date, input.slot],
      );

      if (duplicateResult.rowCount > 0) {
        throw new HttpError(409, duplicateMessage(input.slot));
      }

      const result = await client.query(
        `INSERT INTO readings (user_id, reading_date, slot, value)
         VALUES ($1, $2, $3, $4)
         RETURNING id, reading_date AS date, slot, value, created_at, updated_at`,
        [userId, input.date, input.slot, input.value],
      );

      return mapReading(result.rows[0]);
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(409, duplicateMessage(input.slot));
    }
    throw error;
  }
}

export async function updateReading(userId, id, input) {
  try {
    return await withTransaction(async (client) => {
      await lockUser(client, userId);

      const existingResult = await client.query(
        `SELECT id FROM readings WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [id, userId],
      );

      if (existingResult.rowCount === 0) {
        throw new HttpError(404, 'Reading not found.');
      }

      const countResult = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM readings
         WHERE user_id = $1 AND reading_date = $2 AND id <> $3`,
        [userId, input.date, id],
      );

      if (countResult.rows[0].total >= 4) {
        throw new HttpError(409, maxReadingsMessage());
      }

      const duplicateResult = await client.query(
        `SELECT id FROM readings
         WHERE user_id = $1 AND reading_date = $2 AND slot = $3 AND id <> $4`,
        [userId, input.date, input.slot, id],
      );

      if (duplicateResult.rowCount > 0) {
        throw new HttpError(409, duplicateMessage(input.slot));
      }

      const result = await client.query(
        `UPDATE readings
         SET reading_date = $1, slot = $2, value = $3, updated_at = now()
         WHERE id = $4 AND user_id = $5
         RETURNING id, reading_date AS date, slot, value, created_at, updated_at`,
        [input.date, input.slot, input.value, id, userId],
      );

      return mapReading(result.rows[0]);
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(409, duplicateMessage(input.slot));
    }
    throw error;
  }
}

export async function deleteReading(userId, id) {
  const result = await query(
    'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId],
  );

  if (result.rowCount === 0) {
    throw new HttpError(404, 'Reading not found.');
  }
}
