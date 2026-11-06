const DAY_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const SHORT_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const MONTH_DAY_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
});

export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(value) {
  if (typeof value !== 'string') return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDays(value, amount) {
  const date = parseISODate(value);
  if (!date) return value;
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

export function formatDate(value) {
  const date = parseISODate(value);
  return date ? SHORT_FORMATTER.format(date) : value;
}

export function formatDateWithWeekday(value) {
  const date = parseISODate(value);
  return date ? DAY_FORMATTER.format(date) : value;
}

export function formatMonthDay(value) {
  const date = parseISODate(value);
  return date ? MONTH_DAY_FORMATTER.format(date) : value;
}

export function formatDayNumber(value) {
  const date = parseISODate(value);
  return date ? String(date.getDate()) : value;
}

export function isFutureDate(value) {
  return value > todayISO();
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(name) {
  return (name || '').trim().split(/\s+/)[0] || 'there';
}

export function initials(name) {
  return (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
