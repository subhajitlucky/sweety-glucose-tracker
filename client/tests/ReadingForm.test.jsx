import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingForm from '../src/components/ReadingForm.jsx';
import { addDays, todayISO } from '../src/lib/dates.js';

const createReading = vi.fn();
const updateReading = vi.fn();

vi.mock('../src/api/client.js', () => {
  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }

  return {
    ApiError,
    api: {
      readings: {
        create: (...args) => createReading(...args),
        update: (...args) => updateReading(...args),
      },
    },
  };
});

function renderForm(overrides = {}) {
  const onSaved = vi.fn();
  const onCancel = vi.fn();

  render(
    <ReadingForm
      initialDate={todayISO()}
      onSaved={onSaved}
      onCancel={onCancel}
      {...overrides}
    />,
  );

  return { onSaved, onCancel };
}

async function chooseSlot(user, label = /After lunch/i) {
  await user.click(screen.getByRole('radio', { name: label }));
}

beforeEach(() => {
  createReading.mockReset();
  updateReading.mockReset();
});

describe('ReadingForm validation', () => {
  it('asks for a glucose value when the field is empty', async () => {
    const user = userEvent.setup();
    renderForm();

    await chooseSlot(user);
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument();
    expect(createReading).not.toHaveBeenCalled();
  });

  it('rejects values that are not whole numbers from 40 to 600', async () => {
    const user = userEvent.setup();
    renderForm();

    await chooseSlot(user);
    const valueInput = screen.getByLabelText('Glucose value');

    await user.type(valueInput, '39');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));
    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();

    await user.clear(valueInput);
    await user.type(valueInput, '140.5');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));
    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(createReading).not.toHaveBeenCalled();
  });

  it('rejects a future date with a clear message', async () => {
    const user = userEvent.setup();
    renderForm();

    const dateInput = screen.getByLabelText('Date');
    fireEvent.change(dateInput, { target: { value: addDays(todayISO(), 1) } });
    await chooseSlot(user);
    await user.type(screen.getByLabelText('Glucose value'), '118');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(screen.getByText('Date cannot be in the future.')).toBeInTheDocument();
    expect(createReading).not.toHaveBeenCalled();
  });

  it('submits a valid reading and reports the saved value', async () => {
    const user = userEvent.setup();
    const { onSaved } = renderForm();
    const savedReading = {
      id: 'reading-1',
      date: todayISO(),
      slot: 'after_lunch',
      value: 132,
    };
    createReading.mockResolvedValue({ reading: savedReading });

    await chooseSlot(user);
    await user.type(screen.getByLabelText('Glucose value'), '132');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    await waitFor(() => {
      expect(createReading).toHaveBeenCalledWith({
        date: todayISO(),
        slot: 'after_lunch',
        value: '132',
      });
    });
    expect(onSaved).toHaveBeenCalledWith(savedReading, 'created');
  });

  it('shows the API duplicate-slot message without closing the form', async () => {
    const user = userEvent.setup();
    const { onSaved } = renderForm();
    const { ApiError } = await import('../src/api/client.js');

    createReading.mockRejectedValue(
      new ApiError('You already have an After lunch reading for this date.', 409),
    );

    await chooseSlot(user);
    await user.type(screen.getByLabelText('Glucose value'), '141');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(
      await screen.findByText('You already have an After lunch reading for this date.'),
    ).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
