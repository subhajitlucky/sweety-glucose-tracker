import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  formatDate,
  formatDateWithWeekday,
  parseISODate,
  toISODate,
  todayISO,
} from '../lib/dates.js';
import {
  IconCalendar,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
} from './Icons.jsx';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
});

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function buildCalendar(year, month) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let index = 0; index < mondayOffset; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      iso: toISODate(new Date(year, month - 1, day)),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export default function DatePicker({ value, max, onChange }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const selectedDate = parseISODate(value) || new Date();
  const [view, setView] = useState({
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth() + 1,
  });

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const dialogId = useId();

  const today = todayISO();
  const currentMonthKey = monthKey(
    Number(max.slice(0, 4)),
    Number(max.slice(5, 7)),
  );
  const viewMonthKey = monthKey(view.year, view.month);
  const canGoToNextMonth = viewMonthKey < currentMonthKey;

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(318, window.innerWidth - 16);
    const popoverHeight = 390;
    const sidePadding = 8;
    const left = Math.min(
      Math.max(sidePadding, rect.left),
      window.innerWidth - popoverWidth - sidePadding,
    );
    const fitsBelow = rect.bottom + 8 + popoverHeight < window.innerHeight;
    const top = fitsBelow ? rect.bottom + 8 : Math.max(8, rect.top - popoverHeight - 8);

    setPosition({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const date = parseISODate(value);
    if (date) {
      setView({ year: date.getFullYear(), month: date.getMonth() + 1 });
    }

    const animationFrame = requestAnimationFrame(() => {
      popoverRef.current
        ?.querySelector('.date-picker__day.is-selected')
        ?.focus();
    });

    function handlePointerDown(event) {
      if (
        popoverRef.current?.contains(event.target)
        || triggerRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    function closePicker() {
      setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', closePicker);
    window.addEventListener('scroll', closePicker, true);

    return () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', closePicker);
      window.removeEventListener('scroll', closePicker, true);
    };
  }, [open, value]);

  function toggle() {
    if (!open) {
      const date = parseISODate(value);
      if (date) {
        setView({ year: date.getFullYear(), month: date.getMonth() + 1 });
      }
    }
    setOpen((current) => !current);
  }

  function moveMonth(amount) {
    setView((current) => {
      const date = new Date(current.year, current.month - 1 + amount, 1);
      return { year: date.getFullYear(), month: date.getMonth() + 1 };
    });
  }

  function selectDate(iso) {
    onChange(iso);
    setOpen(false);
    triggerRef.current?.focus();
  }

  const cells = buildCalendar(view.year, view.month);
  const monthLabel = MONTH_FORMATTER.format(new Date(view.year, view.month - 1, 1));

  return (
    <div className="date-picker">
      <button
        ref={triggerRef}
        type="button"
        className="date-navigator__field date-picker__trigger"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        aria-label={`Selected date ${formatDateWithWeekday(value)}. Change date`}
      >
        <IconCalendar size={17} />
        <span className="date-navigator__value">{formatDate(value)}</span>
        <IconChevronDown size={14} className="date-picker__chevron" />
      </button>

      {open && createPortal(
        <div
          ref={popoverRef}
          id={dialogId}
          className="date-picker__popover"
          style={{ top: position.top, left: position.left }}
          role="dialog"
          aria-label="Choose a date"
        >
          <div className="date-picker__header">
            <button
              type="button"
              className="date-picker__month-button"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
            >
              <IconChevronLeft size={17} />
            </button>
            <strong aria-live="polite">{monthLabel}</strong>
            <button
              type="button"
              className="date-picker__month-button"
              onClick={() => moveMonth(1)}
              disabled={!canGoToNextMonth}
              aria-label="Next month"
            >
              <IconChevronRight size={17} />
            </button>
          </div>

          <div className="date-picker__weekdays" aria-hidden="true">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday}>{weekday.slice(0, 2)}</span>
            ))}
          </div>

          <div className="date-picker__grid" role="group" aria-label={`${monthLabel} calendar`}>
            {cells.map((cell, index) => {
              if (!cell) {
                return <span key={`empty-${index}`} className="date-picker__empty" />;
              }

              const isFuture = cell.iso > max;
              const isSelected = cell.iso === value;
              const isToday = cell.iso === today;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  className={[
                    'date-picker__day',
                    isSelected ? 'is-selected' : '',
                    isToday ? 'is-today' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => selectDate(cell.iso)}
                  disabled={isFuture}
                  aria-label={formatDateWithWeekday(cell.iso)}
                  aria-pressed={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="date-picker__footer">
            <span>
              {value === today ? 'Today' : `Selected: ${formatDate(value)}`}
            </span>
            {value !== today && (
              <button
                type="button"
                className="text-button"
                onClick={() => selectDate(today)}
              >
                Go to today
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
