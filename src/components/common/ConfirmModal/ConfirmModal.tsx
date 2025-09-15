import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
  text: string;
  onAccept: () => void;
  onDecline: () => void;
  acceptLabel?: string;
  declineLabel?: string;
}

export function ConfirmModal({
  text,
  onAccept,
  onDecline,
  acceptLabel = 'Yes',
  declineLabel = 'No',
}: ConfirmModalProps) {
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalContent}>
        <div className={styles.modalText}>{text}</div>
        <div className={styles.modalActions}>
          <button
            className={styles.modalButton}
            type="button"
            onClick={onDecline}
          >
            {declineLabel}
          </button>
          <button
            className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
            type="button"
            onClick={onAccept}
          >
            {acceptLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
