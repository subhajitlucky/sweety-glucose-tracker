export const LOW_THRESHOLD = 70;
export const HIGH_THRESHOLD = 180;

export function readingStatus(value) {
  if (value < LOW_THRESHOLD) {
    return { key: 'low', label: 'Low' };
  }
  if (value > HIGH_THRESHOLD) {
    return { key: 'high', label: 'High' };
  }
  return { key: 'in-range', label: 'In range' };
}
