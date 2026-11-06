import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { createApp } from '../src/app.js';
import { pool, query } from '../src/db.js';
import { todayISO } from '../src/utils/date.js';
import {
  ensureTestDatabase,
  resetTestSchema,
  truncateTables,
} from './database.js';

const app = createApp();
const PASSWORD = 'TestPass123!';

function addDaysISO(value, amount) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

async function register(agent, overrides = {}) {
  const details = {
    name: 'Test Patient',
    email: `patient-${Math.random().toString(36).slice(2, 9)}@example.com`,
    password: PASSWORD,
    ...overrides,
  };

  const response = await agent.post('/api/auth/register').send(details);
  expect(response.status).toBe(201);
  return response.body.user;
}

async function createReading(agent, reading) {
  return agent.post('/api/readings').send(reading);
}

beforeAll(async () => {
  await ensureTestDatabase();
  await resetTestSchema();
});

beforeEach(async () => {
  await truncateTables();
});

afterAll(async () => {
  await pool.end();
});

describe('authentication', () => {
  it('registers a user, hashes the password and starts a session', async () => {
    const agent = request.agent(app);
    const email = 'new-user@example.com';

    const response = await agent
      .post('/api/auth/register')
      .send({ name: 'Asha Rao', email, password: PASSWORD });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ name: 'Asha Rao', email });
    expect(response.body.user.password).toBeUndefined();
    expect(response.headers['set-cookie']?.[0]).toContain('sweety_session=');
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');

    const stored = await query(
      'SELECT password_hash FROM users WHERE email = $1',
      [email],
    );
    expect(stored.rows[0].password_hash).not.toBe(PASSWORD);
    expect(stored.rows[0].password_hash.startsWith('$2')).toBe(true);
    expect(await bcrypt.compare(PASSWORD, stored.rows[0].password_hash)).toBe(true);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
  });

  it('rejects duplicate emails, wrong passwords and logged-out sessions', async () => {
    const agent = request.agent(app);
    await register(agent, { email: 'repeat@example.com' });

    const duplicate = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Another Name', email: 'REPEAT@example.com', password: PASSWORD });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toMatch(/already exists/i);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'repeat@example.com', password: 'wrong-password' });
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.message).toBe('Email or password is incorrect.');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'repeat@example.com', password: PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.user.email).toBe('repeat@example.com');

    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(204);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });

  it('requires a session for reading and report endpoints', async () => {
    const readings = await request(app).get('/api/readings');
    expect(readings.status).toBe(401);

    const reports = await request(app).get('/api/reports');
    expect(reports.status).toBe(401);
  });
});

describe('reading validation', () => {
  it('returns the exact validation messages for invalid values and dates', async () => {
    const agent = request.agent(app);
    await register(agent);
    const date = todayISO();

    const missing = await createReading(agent, { date, slot: 'morning', value: '' });
    expect(missing.status).toBe(400);
    expect(missing.body.message).toBe('Please enter a glucose value.');

    const tooLow = await createReading(agent, { date, slot: 'morning', value: 39 });
    expect(tooLow.status).toBe(400);
    expect(tooLow.body.message).toBe('Value must be between 40 and 600 mg/dl.');

    const decimal = await createReading(agent, { date, slot: 'morning', value: 120.5 });
    expect(decimal.status).toBe(400);
    expect(decimal.body.message).toBe('Value must be between 40 and 600 mg/dl.');

    const tooHigh = await createReading(agent, { date, slot: 'morning', value: 601 });
    expect(tooHigh.status).toBe(400);
    expect(tooHigh.body.message).toBe('Value must be between 40 and 600 mg/dl.');

    const future = await createReading(agent, {
      date: addDaysISO(date, 1),
      slot: 'morning',
      value: 120,
    });
    expect(future.status).toBe(400);
    expect(future.body.message).toBe('Date cannot be in the future.');

    const invalidSlot = await createReading(agent, { date, slot: 'midnight', value: 120 });
    expect(invalidSlot.status).toBe(400);
    expect(invalidSlot.body.message).toBe('Please choose a time slot.');
  });

  it('allows only one reading per slot and at most four readings per day', async () => {
    const agent = request.agent(app);
    await register(agent);
    const date = todayISO();

    const first = await createReading(agent, {
      date,
      slot: 'after_lunch',
      value: 132,
    });
    expect(first.status).toBe(201);
    expect(first.body.reading).toMatchObject({
      date,
      slot: 'after_lunch',
      value: 132,
      slotLabel: 'After lunch',
    });

    const duplicate = await createReading(agent, {
      date,
      slot: 'after_lunch',
      value: 150,
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toBe(
      'You already have an After lunch reading for this date.',
    );

    const morning = await createReading(agent, { date, slot: 'morning', value: 101 });
    const breakfast = await createReading(agent, {
      date,
      slot: 'after_breakfast',
      value: 142,
    });
    const dinner = await createReading(agent, { date, slot: 'after_dinner', value: 161 });
    expect([morning.status, breakfast.status, dinner.status]).toEqual([201, 201, 201]);

    const fifth = await createReading(agent, { date, slot: 'morning', value: 99 });
    expect(fifth.status).toBe(409);
    expect(fifth.body.message).toBe('You can add only 4 readings per day.');
  });
});

describe('reading ownership and CRUD', () => {
  it('updates and deletes a reading', async () => {
    const agent = request.agent(app);
    await register(agent);
    const date = todayISO();

    const created = await createReading(agent, {
      date,
      slot: 'after_breakfast',
      value: 140,
    });
    const id = created.body.reading.id;

    const updated = await agent
      .put(`/api/readings/${id}`)
      .send({ date, slot: 'morning', value: 188 });

    expect(updated.status).toBe(200);
    expect(updated.body.reading).toMatchObject({
      id,
      slot: 'morning',
      value: 188,
    });

    const report = await agent.get(`/api/reports?date=${date}`);
    expect(report.status).toBe(200);
    expect(report.body.reports.daily.stats).toMatchObject({
      highest: 188,
      lowest: 188,
      average: 188,
      count: 1,
    });

    const deleted = await agent.delete(`/api/readings/${id}`);
    expect(deleted.status).toBe(204);

    const list = await agent.get('/api/readings');
    expect(list.body.readings).toHaveLength(0);
  });

  it('prevents moving a reading onto an occupied slot or a full day', async () => {
    const agent = request.agent(app);
    await register(agent);
    const date = todayISO();

    await createReading(agent, { date, slot: 'after_lunch', value: 130 });
    const dinner = await createReading(agent, { date, slot: 'after_dinner', value: 150 });

    const collision = await agent
      .put(`/api/readings/${dinner.body.reading.id}`)
      .send({ date, slot: 'after_lunch', value: 150 });
    expect(collision.status).toBe(409);
    expect(collision.body.message).toBe(
      'You already have an After lunch reading for this date.',
    );

    const fullDate = addDaysISO(date, -1);
    for (const [slot, value] of [
      ['morning', 100],
      ['after_breakfast', 120],
      ['after_lunch', 130],
      ['after_dinner', 140],
    ]) {
      await createReading(agent, { date: fullDate, slot, value });
    }

    const secondDate = addDaysISO(date, -2);
    const extra = await createReading(agent, {
      date: secondDate,
      slot: 'morning',
      value: 111,
    });

    const moveToFullDay = await agent
      .put(`/api/readings/${extra.body.reading.id}`)
      .send({ date: fullDate, slot: 'morning', value: 111 });

    expect(moveToFullDay.status).toBe(409);
    expect(moveToFullDay.body.message).toBe('You can add only 4 readings per day.');
  });

  it('keeps one user’s readings and reports private from another user', async () => {
    const owner = request.agent(app);
    const stranger = request.agent(app);
    await register(owner, { email: 'owner@example.com' });
    await register(stranger, { email: 'stranger@example.com' });

    const date = todayISO();
    const created = await createReading(owner, {
      date,
      slot: 'morning',
      value: 112,
    });
    const id = created.body.reading.id;

    const strangerList = await stranger.get('/api/readings');
    expect(strangerList.status).toBe(200);
    expect(strangerList.body.readings).toHaveLength(0);

    expect((await stranger.get(`/api/readings/${id}`)).status).toBe(404);
    expect((await stranger.delete(`/api/readings/${id}`)).status).toBe(404);
    expect(
      (
        await stranger
          .put(`/api/readings/${id}`)
          .send({ date, slot: 'morning', value: 200 })
      ).status,
    ).toBe(404);

    const strangerReport = await stranger.get(`/api/reports?date=${date}`);
    expect(strangerReport.body.reports.daily.stats.count).toBe(0);

    const ownerReport = await owner.get(`/api/reports?date=${date}`);
    expect(ownerReport.body.reports.daily.stats.count).toBe(1);
  });
});

describe('reports', () => {
  it('calculates daily, month-to-date and previous-month statistics', async () => {
    const agent = request.agent(app);
    await register(agent);

    await createReading(agent, {
      date: '2025-02-01',
      slot: 'morning',
      value: 200,
    });
    await createReading(agent, {
      date: '2025-02-15',
      slot: 'after_lunch',
      value: 101,
    });
    await createReading(agent, {
      date: '2025-02-15',
      slot: 'after_dinner',
      value: 150,
    });
    await createReading(agent, {
      date: '2025-01-05',
      slot: 'morning',
      value: 80,
    });
    await createReading(agent, {
      date: '2025-01-05',
      slot: 'after_breakfast',
      value: 120,
    });

    const response = await agent.get('/api/reports?date=2025-02-15');
    expect(response.status).toBe(200);

    const { daily, monthToDate, monthly } = response.body.reports;

    expect(daily.label).toBe('15 Feb 2025');
    expect(daily.stats).toEqual({
      highest: 150,
      lowest: 101,
      average: 125.5,
      count: 2,
    });
    expect(daily.readings.map((reading) => reading.slot)).toEqual([
      'after_lunch',
      'after_dinner',
    ]);

    expect(monthToDate.label).toBe('1 Feb \u2013 15 Feb 2025');
    expect(monthToDate.stats).toEqual({
      highest: 200,
      lowest: 101,
      average: 150.3,
      count: 3,
    });
    expect(monthToDate.trend).toEqual([
      { date: '2025-02-01', average: 200, count: 1 },
      { date: '2025-02-15', average: 125.5, count: 2 },
    ]);

    expect(monthly.label).toBe('1 Jan \u2013 31 Jan 2025');
    expect(monthly.stats).toEqual({
      highest: 120,
      lowest: 80,
      average: 100,
      count: 2,
    });
  });

  it('returns a friendly empty daily report and validates report dates', async () => {
    const agent = request.agent(app);
    await register(agent);

    const empty = await agent.get('/api/reports?date=2025-02-20');
    expect(empty.status).toBe(200);
    expect(empty.body.reports.daily.stats).toEqual({
      highest: null,
      lowest: null,
      average: null,
      count: 0,
    });
    expect(empty.body.reports.daily.readings).toEqual([]);
    expect(empty.body.reports.monthToDate.stats.count).toBe(0);

    const future = await agent.get('/api/reports?date=2099-01-01');
    expect(future.status).toBe(400);
    expect(future.body.message).toBe('Date cannot be in the future.');

    const invalid = await agent.get('/api/reports?date=2025-02-31');
    expect(invalid.status).toBe(400);
    expect(invalid.body.message).toBe('Please choose a valid date.');
  });
});

describe('pagination', () => {
  it('paginates readings with the newest dates first', async () => {
    const agent = request.agent(app);
    await register(agent);
    const today = todayISO();
    const yesterday = addDaysISO(today, -1);
    const twoDaysAgo = addDaysISO(today, -2);

    for (const [date, slots] of [
      [twoDaysAgo, ['morning', 'after_breakfast', 'after_lunch', 'after_dinner']],
      [yesterday, ['morning', 'after_breakfast', 'after_lunch', 'after_dinner']],
      [today, ['morning']],
    ]) {
      for (const slot of slots) {
        const response = await createReading(agent, { date, slot, value: 110 });
        expect(response.status).toBe(201);
      }
    }

    const firstPage = await agent.get('/api/readings?page=1&limit=5');
    expect(firstPage.status).toBe(200);
    expect(firstPage.body.readings).toHaveLength(5);
    expect(firstPage.body.pagination).toEqual({
      page: 1,
      limit: 5,
      total: 9,
      totalPages: 2,
    });
    expect(firstPage.body.readings[0].date).toBe(today);

    const secondPage = await agent.get('/api/readings?page=2&limit=5');
    expect(secondPage.body.readings).toHaveLength(4);
    expect(secondPage.body.pagination.page).toBe(2);
  });
});
