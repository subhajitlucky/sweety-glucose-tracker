import Modal from './Modal.jsx';
import ReadingForm from './ReadingForm.jsx';

export default function ReadingDialog({
  open,
  reading,
  initialDate,
  initialSlot,
  onClose,
  onSaved,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={reading ? 'Update a log' : 'Add to your journal'}
      title={reading ? 'Edit reading' : 'Log a reading'}
    >
      <ReadingForm
        reading={reading}
        initialDate={initialDate}
        initialSlot={initialSlot}
        onCancel={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}
