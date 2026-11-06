import Modal from './Modal.jsx';
import { IconAlert, IconTrash } from './Icons.jsx';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  busy = false,
  error = '',
  onCancel,
  onConfirm,
}) {
  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onCancel}
      eyebrow="Please confirm"
      title={title}
      size="small"
      closeOnBackdrop={!busy}
    >
      <div className="confirm-body">
        <span className="confirm-body__icon" aria-hidden="true">
          <IconTrash size={22} />
        </span>
        <p>{message}</p>
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          <IconAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          Keep it
        </button>
        <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy}>
          {busy ? (
            <>
              <span className="spinner spinner--small" aria-hidden="true" />
              Deleting…
            </>
          ) : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
