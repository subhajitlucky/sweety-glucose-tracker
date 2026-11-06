import { useRef, useState } from 'react';
import { api, ApiError } from '../api/client.js';
import { todayISO } from '../lib/dates.js';
import { SLOT_OPTIONS, validateReadingInput } from '../lib/validation.js';
import FormField from './FormField.jsx';
import {
  IconAlert,
  IconCalendar,
  IconCoffee,
  IconInfo,
  IconMoon,
  IconSun,
  IconSunrise,
} from './Icons.jsx';

const SLOT_ICONS = {
  sunrise: IconSunrise,
  coffee: IconCoffee,
  sun: IconSun,
  moon: IconMoon,
};

export default function ReadingForm({
  reading = null,
  initialDate,
  initialSlot = '',
  onCancel,
  onSaved,
}) {
  const isEditing = Boolean(reading);
  const [form, setForm] = useState({
    date: reading?.date || initialDate || todayISO(),
    slot: reading?.slot || initialSlot || '',
    value: reading ? String(reading.value) : '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateReadingInput(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() => {
        formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    setSubmitting(true);
    setServerError('');

    try {
      const payload = {
        date: form.date,
        slot: form.slot,
        value: form.value,
      };
      const result = isEditing
        ? await api.readings.update(reading.id, payload)
        : await api.readings.create(payload);
      onSaved(result.reading, isEditing ? 'updated' : 'created');
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Could not save the reading. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} className="reading-form" onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="alert alert--error" role="alert">
          <IconAlert size={18} />
          <span>{serverError}</span>
        </div>
      )}

      <div className="reading-form__row">
        <FormField
          id="reading-date"
          label="Date"
          error={errors.date}
          className="reading-form__date"
        >
          {({ describedBy, invalid }) => (
            <div className="input-icon">
              <IconCalendar size={18} />
              <input
                id="reading-date"
                name="date"
                type="date"
                max={todayISO()}
                value={form.date}
                onChange={(event) => updateField('date', event.target.value)}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                data-autofocus="true"
              />
            </div>
          )}
        </FormField>

        <FormField
          id="reading-value"
          label="Glucose value"
          error={errors.value}
          className="reading-form__value"
        >
          {({ describedBy, invalid }) => (
            <div className="input-suffix">
              <input
                id="reading-value"
                name="value"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 108"
                value={form.value}
                onChange={(event) => updateField('value', event.target.value)}
                aria-invalid={invalid}
                aria-describedby={describedBy}
              />
              <span>mg/dL</span>
            </div>
          )}
        </FormField>
      </div>

      <fieldset className={`slot-picker ${errors.slot ? 'slot-picker--error' : ''}`}>
        <legend>Time slot</legend>
        <p className="slot-picker__hint">One reading for each moment of the day.</p>

        <div className="slot-picker__grid">
          {SLOT_OPTIONS.map((slot) => {
            const SlotIcon = SLOT_ICONS[slot.icon];
            const selected = form.slot === slot.value;

            return (
              <label
                key={slot.value}
                className={`slot-option ${selected ? 'slot-option--selected' : ''}`}
              >
                <input
                  type="radio"
                  name="slot"
                  value={slot.value}
                  checked={selected}
                  onChange={() => updateField('slot', slot.value)}
                  aria-invalid={Boolean(errors.slot)}
                />
                <span className="slot-option__icon">
                  <SlotIcon size={19} />
                </span>
                <span className="slot-option__copy">
                  <strong>{slot.label}</strong>
                  <small>{slot.hint}</small>
                </span>
                <span className="slot-option__radio" aria-hidden="true" />
              </label>
            );
          })}
        </div>

        {errors.slot && <p className="field__error">{errors.slot}</p>}
      </fieldset>

      <div className="reading-form__tip">
        <IconInfo size={17} />
        <span>
          Values must be whole numbers between 40 and 600 mg/dL. You can log one
          reading per slot each day.
        </span>
      </div>

      <div className="modal-actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner spinner--small" aria-hidden="true" />
              Saving…
            </>
          ) : isEditing ? 'Save changes' : 'Add reading'}
        </button>
      </div>
    </form>
  );
}
