import { useEffect } from 'react';
import { IconAlert, IconCheck, IconX } from './Icons.jsx';

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.tone === 'error';

  return (
    <div
      className={`toast ${isError ? 'toast--error' : ''}`}
      role={isError ? 'alert' : 'status'}
    >
      <span className="toast__icon">
        {isError ? <IconAlert size={18} /> : <IconCheck size={18} />}
      </span>
      <span>{toast.message}</span>
      <button
        type="button"
        className="toast__close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <IconX size={16} />
      </button>
    </div>
  );
}
