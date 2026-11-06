import { formatDateWithWeekday } from '../lib/dates.js';
import { readingStatus } from '../lib/glucose.js';
import {
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconLeaf,
  IconPlus,
  IconTrash,
  IconAlert,
} from './Icons.jsx';

function SkeletonRows() {
  return (
    <div className="history-skeleton" aria-label="Loading reading history">
      {[0, 1, 2, 3].map((row) => (
        <div className="skeleton-row" key={row}>
          <span className="skeleton skeleton--wide" />
          <span className="skeleton" />
          <span className="skeleton skeleton--short" />
          <span className="skeleton skeleton--round" />
        </div>
      ))}
    </div>
  );
}

export default function HistoryTable({
  readings,
  pagination,
  loading,
  onPageChange,
  onEdit,
  onDelete,
  onAdd,
  error = '',
  onRetry,
}) {
  const total = pagination?.total ?? 0;
  const page = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * (pagination?.limit || 0) + 1;
  const to = Math.min(page * (pagination?.limit || 0), total);

  return (
    <section className="panel history-panel" aria-labelledby="history-title" aria-busy={loading}>
      <header className="section-heading section-heading--history">
        <div>
          <span className="eyebrow">Your journal</span>
          <h2 id="history-title">Reading history</h2>
          <p>Every reading, newest first.</p>
        </div>
        {onAdd && (
          <button type="button" className="btn btn--secondary" onClick={onAdd}>
            <IconPlus size={17} />
            Add reading
          </button>
        )}
      </header>

      {error ? (
        <div className="inline-error" role="alert">
          <IconAlert size={19} />
          <div>
            <strong>Could not load your reading history.</strong>
            <p>{error}</p>
          </div>
          {onRetry && (
            <button type="button" className="btn btn--secondary" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      ) : loading && readings.length === 0 ? (
        <SkeletonRows />
      ) : readings.length === 0 ? (
        <div className="history-empty">
          <span className="history-empty__icon">
            <IconLeaf size={28} />
          </span>
          <strong>Your journal is ready for its first entry.</strong>
          <p>Log a reading to begin building your personal glucose history.</p>
          {onAdd && (
            <button type="button" className="btn btn--primary" onClick={onAdd}>
              <IconPlus size={17} />
              Log a reading
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="history-table">
              <caption className="sr-only">
                All glucose readings. Page {page} of {totalPages}.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Time slot</th>
                  <th scope="col">Glucose</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {readings.map((reading) => {
                  const status = readingStatus(reading.value);
                  return (
                    <tr key={reading.id}>
                      <td data-label="Date">
                        <span className="history-date">
                          {formatDateWithWeekday(reading.date)}
                        </span>
                      </td>
                      <td data-label="Time slot">
                        <span className="slot-label">{reading.slotLabel}</span>
                      </td>
                      <td data-label="Glucose">
                        <span className="history-value">
                          {reading.value}
                          <small>mg/dL</small>
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className={`status-pill status-pill--${status.key}`}>
                          <i aria-hidden="true" />
                          {status.label}
                        </span>
                      </td>
                      <td className="history-actions-cell">
                        <div className="history-actions">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => onEdit(reading)}
                            aria-label={`Edit ${reading.slotLabel} reading on ${formatDateWithWeekday(reading.date)}`}
                            title="Edit reading"
                          >
                            <IconEdit size={17} />
                          </button>
                          <button
                            type="button"
                            className="icon-button icon-button--danger"
                            onClick={() => onDelete(reading)}
                            aria-label={`Delete ${reading.slotLabel} reading on ${formatDateWithWeekday(reading.date)}`}
                            title="Delete reading"
                          >
                            <IconTrash size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <footer className="history-footer">
            <p>
              Showing {from}–{to} of {total}
            </p>
            {totalPages > 1 && (
              <nav className="pagination" aria-label="Reading history pages">
                <button
                  type="button"
                  className="icon-button icon-button--bordered"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1 || loading}
                  aria-label="Previous page"
                >
                  <IconChevronLeft size={18} />
                </button>
                <span>
                  Page <strong>{page}</strong> of {totalPages}
                </span>
                <button
                  type="button"
                  className="icon-button icon-button--bordered"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages || loading}
                  aria-label="Next page"
                >
                  <IconChevronRight size={18} />
                </button>
              </nav>
            )}
          </footer>
        </>
      )}
    </section>
  );
}
