import { isFutureDate } from './dates.js';

export const SLOT_OPTIONS = [
  { value: 'morning', label: 'Morning', hint: 'Fasting', icon: 'sunrise' },
  { value: 'after_breakfast', label: 'After breakfast', hint: 'Post-meal', icon: 'coffee' },
  { value: 'after_lunch', label: 'After lunch', hint: 'Post-meal', icon: 'sun' },
  { value: 'after_dinner', label: 'After dinner', hint: 'Post-meal', icon: 'moon' },
];

export const SLOT_LABELS = Object.fromEntries(
  SLOT_OPTIONS.map((slot) => [slot.value, slot.label]),
);

export function validateReadingInput({ date, slot, value }) {
  const errors = {};

  if (!date) {
    errors.date = 'Please choose a date.';
  } else if (isFutureDate(date)) {
    errors.date = 'Date cannot be in the future.';
  }

  if (!slot) {
    errors.slot = 'Please choose a time slot.';
  }

  const rawValue = typeof value === 'string' ? value.trim() : value;
  if (rawValue === '' || rawValue === undefined || rawValue === null) {
    errors.value = 'Please enter a glucose value.';
  } else {
    const numericValue = Number(rawValue);
    if (
      !Number.isInteger(numericValue) ||
      numericValue < 40 ||
      numericValue > 600
    ) {
      errors.value = 'Value must be between 40 and 600 mg/dl.';
    }
  }

  return errors;
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Please enter your email address.';
  if (!password) errors.password = 'Please enter your password.';
  return errors;
}

export function validateRegistration({ name, email, password, confirmPassword }) {
  const errors = {};

  if (!name.trim()) {
    errors.name = 'Please enter your name.';
  } else if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!email.trim()) {
    errors.email = 'Please enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Please enter a password.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}
