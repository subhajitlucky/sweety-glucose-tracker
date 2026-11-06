import { useAuth } from '../context/AuthContext.jsx';
import {
  firstName,
  formatDate,
  getGreeting,
  todayISO,
} from '../lib/dates.js';
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
} from './Icons.jsx';

export default function DashboardHero({
  selectedDate,
  dailyReport,
  onDateChange,
  onPreviousDay,
  onNextDay,
  onToday,
  onAdd,
}) {
  const { user } = useAuth();
  const today = todayISO();
  const count = dailyReport?.stats.count ?? 0;
  const progress = Math.min(100, (count / 4) * 100);
  const isToday = selectedDate === today;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__pattern" aria-hidden="true" />

      <div className="hero__main">
        <span className="eyebrow eyebrow--light">Your glucose journal</span>
        <h1 id="hero-title">
          {getGreeting()}, {firstName(user?.name)}.
        </h1>
        <p className="hero__lead">
          {count === 0
            ? 'A new day, a fresh page. Start with your first reading.'
            : 'A quiet look at your day so far — no judgement, just patterns.'}
        </p>

        <div className="hero__controls">
          <div className="date-navigator" aria-label="Choose a date to view">
            <button
              type="button"
              className="date-navigator__arrow"
              onClick={onPreviousDay}
              aria-label="Previous day"
            >
              <IconChevronLeft size={18} />
            </button>

            <label className="date-navigator__field">
              <IconCalendar size={17} />
              <span className="sr-only">Selected date</span>
              <span className="date-navigator__value" aria-hidden="true">
                {formatDate(selectedDate)}
              </span>
              <input
                type="date"
                value={selectedDate}
                max={today}
                onChange={(event) => onDateChange(event.target.value)}
              />
            </label>

            <button
              type="button"
              className="date-navigator__arrow"
              onClick={onNextDay}
              disabled={isToday}
              aria-label="Next day"
            >
              <IconChevronRight size={18} />
            </button>
          </div>

          {!isToday && (
            <button type="button" className="hero__today" onClick={onToday}>
              Back to today
            </button>
          )}

          <button type="button" className="btn btn--coral" onClick={onAdd}>
            <IconPlus size={18} />
            Log a reading
          </button>
        </div>

        <p className="hero__date-copy">
          Showing <strong>{formatDate(selectedDate)}</strong>
          {!isToday && ' · selected day'}
        </p>
      </div>

      <aside className="hero__progress" aria-label={`${count} of 4 readings logged`}>
        <div
          className="progress-ring"
          style={{
            background: `conic-gradient(#f0a080 ${progress}%, rgba(255,255,255,0.12) 0)`,
          }}
        >
          <div className="progress-ring__inner">
            <strong>{count}</strong>
            <span>of 4</span>
          </div>
        </div>

        <div className="hero__progress-copy">
          <span className="hero__progress-label">Readings logged</span>
          <strong>{count === 4 ? 'A full picture' : `${4 - count} spot${4 - count === 1 ? '' : 's'} left`}</strong>
          <div className="progress-dots" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <span key={index} className={index < count ? 'is-filled' : ''} />
            ))}
          </div>
          <p>
            {count === 4
              ? 'Your day is complete. Come back tomorrow for a new page.'
              : 'Log each moment after it happens — no need to do it all at once.'}
          </p>
        </div>
      </aside>
    </section>
  );
}
