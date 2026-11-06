import { readingStatus } from '../lib/glucose.js';
import {
  IconCoffee,
  IconMoon,
  IconPlus,
  IconSun,
  IconSunrise,
} from './Icons.jsx';

const SLOT_ICONS = {
  morning: IconSunrise,
  after_breakfast: IconCoffee,
  after_lunch: IconSun,
  after_dinner: IconMoon,
};

function formatAverage(average) {
  return typeof average === 'number' ? average.toFixed(1) : '—';
}

function Stats({ stats, compact = false }) {
  const items = [
    { label: 'Highest', value: stats.highest ?? '—', unit: 'mg/dL' },
    { label: 'Lowest', value: stats.lowest ?? '—', unit: 'mg/dL' },
    { label: 'Average', value: formatAverage(stats.average), unit: 'mg/dL' },
    { label: 'Readings', value: stats.count, unit: stats.count === 1 ? 'log' : 'logs' },
  ];

  return (
    <dl className={`report-stats ${compact ? 'report-stats--compact' : ''}`}>
      {items.map((item) => (
        <div key={item.label} className="report-stat">
          <dt>{item.label}</dt>
          <dd>
            <strong>{item.value}</strong>
            <span>{item.unit}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EmptyReport({ type, onAdd }) {
  const messages = {
    daily: 'No readings on this day yet. One small log is a good place to start.',
    'month-to-date': 'No readings yet this month. Your pattern will appear here as you log.',
    monthly: 'No readings last month. This month is a fresh page.',
  };

  return (
    <div className="report-empty">
      <div className="report-empty__graphic" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p>{messages[type]}</p>
      {type === 'daily' && onAdd && (
        <button type="button" className="text-button" onClick={onAdd}>
          <IconPlus size={16} />
          Log a reading
        </button>
      )}
    </div>
  );
}

export default function ReportCard({ report, variant = 'full', onAdd }) {
  const isEmpty = report.stats.count === 0;

  if (variant === 'compact') {
    return (
      <article className="report-card report-card--compact">
        <header className="report-card__top">
          <div>
            <span className="report-kicker">{report.title}</span>
            <h3>{report.label}</h3>
          </div>
          <span className="report-count">
            {report.stats.count} {report.stats.count === 1 ? 'reading' : 'readings'}
          </span>
        </header>

        {isEmpty ? (
          <EmptyReport type={report.type} />
        ) : (
          <Stats stats={report.stats} compact />
        )}
      </article>
    );
  }

  return (
    <article className="report-card report-card--daily">
      <header className="report-card__top">
        <div>
          <span className="report-kicker">{report.title} report</span>
          <h3>{report.label}</h3>
        </div>
        <span className="report-count">
          {report.stats.count} {report.stats.count === 1 ? 'reading' : 'readings'}
        </span>
      </header>

      {isEmpty ? (
        <EmptyReport type={report.type} onAdd={onAdd} />
      ) : (
        <>
          <Stats stats={report.stats} />
          <div className="daily-readings">
            <div className="daily-readings__heading">
              <span>Reading</span>
              <span>Glucose</span>
            </div>
            {report.readings.map((reading) => {
              const SlotIcon = SLOT_ICONS[reading.slot];
              const status = readingStatus(reading.value);

              return (
                <div className="daily-reading" key={reading.id}>
                  <span className="daily-reading__icon">
                    <SlotIcon size={18} />
                  </span>
                  <span className="daily-reading__slot">
                    <strong>{reading.slotLabel}</strong>
                    <span className={`status status--${status.key}`}>
                      <i aria-hidden="true" />
                      {status.label}
                    </span>
                  </span>
                  <span className="daily-reading__value">
                    {reading.value}
                    <small>mg/dL</small>
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </article>
  );
}
