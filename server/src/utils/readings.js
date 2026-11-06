export const SLOT_KEYS = [
  'morning',
  'after_breakfast',
  'after_lunch',
  'after_dinner',
];

export const SLOT_LABELS = {
  morning: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

export const SLOT_SHORT_LABELS = {
  morning: 'Morning',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

// A stable order for the four cards and for readings returned by the API.
export const SLOT_SQL_ORDER = `CASE slot
  WHEN 'morning' THEN 1
  WHEN 'after_breakfast' THEN 2
  WHEN 'after_lunch' THEN 3
  WHEN 'after_dinner' THEN 4
  ELSE 5
END`;

export function mapReading(row) {
  return {
    id: row.id,
    date: row.date,
    slot: row.slot,
    slotLabel: SLOT_LABELS[row.slot],
    value: row.value,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
