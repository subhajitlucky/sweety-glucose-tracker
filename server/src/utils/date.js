const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function pad(value) {
  return String(value).padStart(2, '0');
}

export function toISODate(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Returns the server's local calendar date as YYYY-MM-DD. */
export function todayISO() {
  const now = new Date();
  return toISODate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Validates both the format and that the calendar date actually exists. */
export function isValidISODate(value) {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseISODate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

export function formatLongDate(value) {
  const { year, month, day } = parseISODate(value);
  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}

function formatDayMonth(value) {
  const { month, day } = parseISODate(value);
  return `${day} ${MONTHS_SHORT[month - 1]}`;
}

/** Formats a range like "1 Sep – 30 Sep 2026". */
export function formatDateRange(start, end) {
  if (start === end) {
    return formatLongDate(start);
  }

  const startParts = parseISODate(start);
  const endParts = parseISODate(end);

  if (startParts.year === endParts.year) {
    return `${formatDayMonth(start)} \u2013 ${formatDayMonth(end)} ${endParts.year}`;
  }

  return `${formatLongDate(start)} \u2013 ${formatLongDate(end)}`;
}

/**
 * Returns the three report windows required by the product brief.
 * `selectedDate` is a validated YYYY-MM-DD date.
 */
export function getReportRanges(selectedDate) {
  const { year, month } = parseISODate(selectedDate);

  const monthToDateStart = toISODate(year, month, 1);

  // Date.UTC month is zero-based. For October (month = 10) this evaluates to
  // 1 September (month index 8), and day 0 of October (month index 9) is
  // 30 September.
  const previousStart = new Date(Date.UTC(year, month - 2, 1));
  const previousEnd = new Date(Date.UTC(year, month - 1, 0));

  const previousStartISO = toISODate(
    previousStart.getUTCFullYear(),
    previousStart.getUTCMonth() + 1,
    previousStart.getUTCDate(),
  );
  const previousEndISO = toISODate(
    previousEnd.getUTCFullYear(),
    previousEnd.getUTCMonth() + 1,
    previousEnd.getUTCDate(),
  );

  return {
    daily: { start: selectedDate, end: selectedDate },
    monthToDate: { start: monthToDateStart, end: selectedDate },
    previousMonth: { start: previousStartISO, end: previousEndISO },
  };
}
