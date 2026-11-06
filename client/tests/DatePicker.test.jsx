import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DatePicker from '../src/components/DatePicker.jsx';
import { formatDateWithWeekday } from '../src/lib/dates.js';

const MAX_DATE = '2026-11-06';

describe('DatePicker', () => {
  it('opens a calendar and selects a date from the previous month', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<DatePicker value={MAX_DATE} max={MAX_DATE} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /Change date/ }));
    expect(screen.getByRole('dialog', { name: 'Choose a date' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await user.click(
      screen.getByRole('button', { name: formatDateWithWeekday('2026-10-15') }),
    );

    expect(onChange).toHaveBeenCalledWith('2026-10-15');
    expect(screen.queryByRole('dialog', { name: 'Choose a date' })).not.toBeInTheDocument();
  });

  it('does not allow choosing a date after the maximum date', async () => {
    const user = userEvent.setup();

    render(<DatePicker value={MAX_DATE} max={MAX_DATE} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Change date/ }));

    expect(
      screen.getByRole('button', { name: formatDateWithWeekday('2026-11-07') }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });
});
