import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import DashboardHeader from '../components/DashboardHeader.jsx';
import DashboardHero from '../components/DashboardHero.jsx';
import SlotCard from '../components/SlotCard.jsx';
import ReportCard from '../components/ReportCard.jsx';
import HistoryTable from '../components/HistoryTable.jsx';
import ReadingDialog from '../components/ReadingDialog.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Toast from '../components/Toast.jsx';
import { api, ApiError } from '../api/client.js';
import { addDays, formatDate, todayISO } from '../lib/dates.js';
import { SLOT_OPTIONS } from '../lib/validation.js';
import {
  IconAlert,
  IconCalendar,
  IconInfo,
  IconSparkle,
} from '../components/Icons.jsx';

const HISTORY_PAGE_SIZE = 8;
const TrendChart = lazy(() => import('../components/TrendChart.jsx'));

export default function DashboardPage() {
  const today = todayISO();
  const [selectedDate, setSelectedDate] = useState(today);
  const [reports, setReports] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState('');
  const [history, setHistory] = useState({
    readings: [],
    pagination: { page: 1, limit: HISTORY_PAGE_SIZE, total: 0, totalPages: 1 },
  });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [dialog, setDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let active = true;
    setReportsLoading(true);
    setReportsError('');
    setReports((current) => (
      current?.selectedDate === selectedDate ? current : null
    ));

    api.reports
      .get(selectedDate)
      .then((data) => {
        if (active) setReports(data.reports);
      })
      .catch((error) => {
        if (!active) return;
        setReportsError(
          error instanceof ApiError
            ? error.message
            : 'Could not load your reports. Please try again.',
        );
      })
      .finally(() => {
        if (active) setReportsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDate, version]);

  useEffect(() => {
    let active = true;
    setHistoryLoading(true);
    setHistoryError('');

    api.readings
      .list({ page, limit: HISTORY_PAGE_SIZE })
      .then((data) => {
        if (!active) return;
        setHistory(data);
        if (data.pagination.totalPages < page) {
          setPage(data.pagination.totalPages);
        }
      })
      .catch((error) => {
        if (!active) return;
        setHistoryError(
          error instanceof ApiError
            ? error.message
            : 'Could not load your reading history. Please try again.',
        );
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, version]);

  const dismissToast = useCallback(() => setToast(null), []);

  const dailyReadings = reports?.daily?.readings || [];

  function refresh() {
    setVersion((current) => current + 1);
  }

  function handleDateChange(value) {
    if (!value) {
      setSelectedDate(today);
      return;
    }
    if (value > today) {
      setToast({ tone: 'error', message: 'Date cannot be in the future.' });
      return;
    }
    setSelectedDate(value);
  }

  function handlePreviousDay() {
    setSelectedDate((current) => addDays(current, -1));
  }

  function handleNextDay() {
    setSelectedDate((current) => {
      const next = addDays(current, 1);
      return next > today ? current : next;
    });
  }

  function openCreate(slot = '') {
    setDialog({
      reading: null,
      initialDate: selectedDate,
      initialSlot: slot,
    });
  }

  function openEdit(reading) {
    setDialog({
      reading,
      initialDate: reading.date,
      initialSlot: reading.slot,
    });
  }

  function handleSaved(reading, action) {
    setDialog(null);
    setSelectedDate(reading.date);
    setPage(1);
    refresh();
    setToast({
      tone: 'success',
      message:
        action === 'created'
          ? `${reading.slotLabel} reading added.`
          : `${reading.slotLabel} reading updated.`,
    });
  }

  function requestDelete(reading) {
    setDeleteError('');
    setDeleteTarget(reading);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');

    try {
      await api.readings.remove(deleteTarget.id);
      const deletedDate = deleteTarget.date;
      setDeleteTarget(null);
      refresh();
      setToast({
        tone: 'success',
        message:
          deletedDate === selectedDate
            ? 'Reading deleted. Your reports are up to date.'
            : 'Reading deleted.',
      });
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.message
          : 'Could not delete this reading. Please try again.',
      );
    } finally {
      setDeleting(false);
    }
  }

  const reportsUnavailable = reportsError && !reports;

  return (
    <div className="app-shell">
      <DashboardHeader />

      <main className="dashboard">
        <DashboardHero
          selectedDate={selectedDate}
          dailyReport={reports?.daily}
          onDateChange={handleDateChange}
          onPreviousDay={handlePreviousDay}
          onNextDay={handleNextDay}
          onToday={() => setSelectedDate(today)}
          onAdd={() => openCreate()}
        />

        <section className="slots-section" aria-labelledby="slots-title">
          <div className="slots-section__heading">
            <div>
              <span className="eyebrow">The four moments</span>
              <h2 id="slots-title">{formatDate(selectedDate)}</h2>
            </div>
            <span className="slots-section__hint">
              Tap a card to add or edit that reading.
            </span>
          </div>

          <div className="slots-grid">
            {SLOT_OPTIONS.map((slot) => {
              const reading = dailyReadings.find((item) => item.slot === slot.value);
              return (
                <SlotCard
                  key={slot.value}
                  slot={slot}
                  reading={reading}
                  onClick={() => (reading ? openEdit(reading) : openCreate(slot.value))}
                />
              );
            })}
          </div>
        </section>

        {reportsError && reports && (
          <div className="inline-error" role="alert">
            <IconAlert size={19} />
            <div>
              <strong>Your latest report could not be loaded.</strong>
              <p>{reportsError}</p>
            </div>
            <button type="button" className="btn btn--secondary" onClick={refresh}>
              Try again
            </button>
          </div>
        )}

        <section className="reports-section" aria-labelledby="reports-title">
          <header className="section-heading">
            <div>
              <span className="eyebrow">
                <IconSparkle size={15} />
                Reports
              </span>
              <h2 id="reports-title">Numbers with a little more meaning.</h2>
              <p>Your selected date, the month so far, and the month before.</p>
            </div>
            <span className="report-date">
              <IconCalendar size={16} />
              {formatDate(selectedDate)}
            </span>
          </header>

          {reportsUnavailable ? (
            <div className="panel state-panel">
              <IconAlert size={28} />
              <h3>Reports are taking a moment.</h3>
              <p>{reportsError}</p>
              <button type="button" className="btn btn--primary" onClick={refresh}>
                Try again
              </button>
            </div>
          ) : reports ? (
            <div className={`reports-layout ${reportsLoading ? 'is-refreshing' : ''}`}>
              <ReportCard
                report={reports.daily}
                onAdd={() => openCreate()}
              />
              <div className="reports-side">
                <ReportCard report={reports.monthToDate} variant="compact" />
                <ReportCard report={reports.monthly} variant="compact" />
              </div>
            </div>
          ) : (
            <div className="reports-layout reports-layout--loading" aria-label="Loading reports">
              <div className="panel skeleton-panel skeleton-panel--daily" />
              <div className="reports-side">
                <div className="panel skeleton-panel" />
                <div className="panel skeleton-panel" />
              </div>
            </div>
          )}
        </section>

        <Suspense
          fallback={(
            <section className="panel trend-panel" aria-label="Loading chart">
              <div className="chart-skeleton" />
            </section>
          )}
        >
          <TrendChart report={reports?.monthToDate} loading={reportsLoading} />
        </Suspense>

        <HistoryTable
          readings={history.readings}
          pagination={history.pagination}
          loading={historyLoading}
          error={historyError}
          onRetry={refresh}
          onPageChange={setPage}
          onEdit={openEdit}
          onDelete={requestDelete}
          onAdd={() => openCreate()}
        />

        <footer className="dashboard-footer">
          <span className="dashboard-footer__brand">sweety.</span>
          <p>
            <IconInfo size={15} />
            A personal record, not medical advice. Your clinician’s target range
            comes first.
          </p>
          <span className="dashboard-footer__meta">Made for calmer days.</span>
        </footer>
      </main>

      <ReadingDialog
        key={dialog?.reading?.id || dialog?.initialSlot || 'new'}
        open={Boolean(dialog)}
        reading={dialog?.reading}
        initialDate={dialog?.initialDate}
        initialSlot={dialog?.initialSlot}
        onClose={() => setDialog(null)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this reading?"
        message={
          deleteTarget
            ? `This will remove the ${deleteTarget.slotLabel} reading of ${deleteTarget.value} mg/dL from ${formatDate(deleteTarget.date)}. This cannot be undone.`
            : ''
        }
        busy={deleting}
        error={deleteError}
        onCancel={() => {
          if (!deleting) {
            setDeleteTarget(null);
            setDeleteError('');
          }
        }}
        onConfirm={confirmDelete}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
