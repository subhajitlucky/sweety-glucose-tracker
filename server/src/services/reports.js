import { query } from '../db.js';
import { formatDateRange, getReportRanges } from '../utils/date.js';
import { mapReading, SLOT_SQL_ORDER } from '../utils/readings.js';

function normalizeStats(row) {
  return {
    highest: row.highest,
    lowest: row.lowest,
    average: row.average,
    count: row.count,
  };
}

async function fetchStats(userId, start, end) {
  const result = await query(
    `SELECT
       MAX(value) AS highest,
       MIN(value) AS lowest,
       ROUND(AVG(value)::numeric, 1)::float AS average,
       COUNT(*)::int AS count
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, start, end],
  );

  return normalizeStats(result.rows[0]);
}

async function fetchDailyReadings(userId, date) {
  const result = await query(
    `SELECT id, reading_date AS date, slot, value, created_at, updated_at
     FROM readings
     WHERE user_id = $1 AND reading_date = $2
     ORDER BY ${SLOT_SQL_ORDER}`,
    [userId, date],
  );

  return result.rows.map(mapReading);
}

async function fetchTrend(userId, start, end) {
  const result = await query(
    `SELECT
       reading_date AS date,
       ROUND(AVG(value)::numeric, 1)::float AS average,
       COUNT(*)::int AS count
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
     GROUP BY reading_date
     ORDER BY reading_date`,
    [userId, start, end],
  );

  return result.rows;
}

function makeReport(type, title, range, stats) {
  return {
    type,
    title,
    range,
    label: formatDateRange(range.start, range.end),
    stats,
  };
}

export async function getReports(userId, selectedDate) {
  const ranges = getReportRanges(selectedDate);

  const [dailyStats, monthToDateStats, previousMonthStats, dailyReadings, trend] =
    await Promise.all([
      fetchStats(userId, ranges.daily.start, ranges.daily.end),
      fetchStats(userId, ranges.monthToDate.start, ranges.monthToDate.end),
      fetchStats(userId, ranges.previousMonth.start, ranges.previousMonth.end),
      fetchDailyReadings(userId, selectedDate),
      fetchTrend(userId, ranges.monthToDate.start, ranges.monthToDate.end),
    ]);

  const daily = makeReport('daily', 'Daily', ranges.daily, dailyStats);
  daily.readings = dailyReadings;

  const monthToDate = makeReport(
    'month-to-date',
    'Month to date',
    ranges.monthToDate,
    monthToDateStats,
  );
  monthToDate.trend = trend;

  const monthly = makeReport(
    'monthly',
    'Monthly',
    ranges.previousMonth,
    previousMonthStats,
  );

  return {
    selectedDate,
    daily,
    monthToDate,
    monthly,
  };
}
