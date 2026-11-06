import { z } from 'zod';
import { SLOT_KEYS } from './readings.js';
import { isValidISODate, todayISO } from './date.js';

const nameSchema = z
  .string({ error: 'Please enter your name.' })
  .trim()
  .min(1, 'Please enter your name.')
  .min(2, 'Name must be at least 2 characters.')
  .max(80, 'Name must be 80 characters or fewer.');

const emailSchema = z
  .string({ error: 'Please enter your email address.' })
  .trim()
  .min(1, 'Please enter your email address.')
  .toLowerCase()
  .email('Please enter a valid email address.')
  .max(254, 'Please enter a valid email address.');

const passwordSchema = z
  .string({ error: 'Please enter a password.' })
  .min(1, 'Please enter a password.')
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be 72 characters or fewer.');

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: 'Please enter your password.' })
    .min(1, 'Please enter your password.'),
});

const dateSchema = z
  .string({ error: 'Please choose a date.' })
  .trim()
  .min(1, 'Please choose a date.')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please choose a valid date.')
  .refine(isValidISODate, 'Please choose a valid date.')
  .refine((value) => value <= todayISO(), 'Date cannot be in the future.');

const slotSchema = z.enum(SLOT_KEYS, {
  error: 'Please choose a time slot.',
});

const glucoseValueSchema = z
  .any()
  .superRefine((rawValue, context) => {
    const isMissing =
      rawValue === undefined ||
      rawValue === null ||
      (typeof rawValue === 'string' && rawValue.trim() === '');

    if (isMissing) {
      context.addIssue({
        code: 'custom',
        message: 'Please enter a glucose value.',
      });
      return;
    }

    const numericValue =
      typeof rawValue === 'string' ? Number(rawValue.trim()) : rawValue;

    if (
      typeof numericValue !== 'number' ||
      !Number.isInteger(numericValue) ||
      numericValue < 40 ||
      numericValue > 600
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Value must be between 40 and 600 mg/dl.',
      });
    }
  })
  .transform((rawValue) => (
    typeof rawValue === 'string' ? Number(rawValue.trim()) : rawValue
  ));

export const readingSchema = z.object({
  date: dateSchema,
  slot: slotSchema,
  value: glucoseValueSchema,
});

export const readingUpdateSchema = readingSchema;

export const reportQuerySchema = z.object({
  date: dateSchema.optional(),
});

export const idSchema = z.uuid({ error: 'Reading not found.' });

/**
 * Returns the first validation message so the UI can show one clear error.
 */
export function firstValidationError(result) {
  if (result.success) {
    return null;
  }

  return result.error.issues[0]?.message || 'Please check the information and try again.';
}
