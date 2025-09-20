import React from 'react';
import { useTranslation } from 'react-i18next';
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
  acceptLabel,
  declineLabel,
}: ConfirmModalProps) {
  const { t } = useTranslation('common');
  const declineRef = React.useRef<HTMLButtonElement>(null);
  const acceptRef = React.useRef<HTMLButtonElement>(null);
  const headingId = React.useId();

  React.useEffect(() => {
    // Initial focus on the first interactive element (decline)
    declineRef.current?.focus();

    // Key handling for ESC and focus trap using Tab
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onDecline();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = [declineRef.current, acceptRef.current].filter(
          (el): el is HTMLButtonElement => !!el
        );
        if (focusable.length === 0) return;
        const currentIndex = focusable.indexOf(
          document.activeElement as HTMLButtonElement
        );
        if (e.shiftKey) {
          if (currentIndex <= 0) {
            e.preventDefault();
            focusable[focusable.length - 1]?.focus();
          }
        } else {
          if (currentIndex === focusable.length - 1) {
            e.preventDefault();
            focusable[0]?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onDecline]);

  const yesLabel = acceptLabel ?? t('yes', 'Yes');
  const noLabel = declineLabel ?? t('no', 'No');

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      tabIndex={-1}
    >
      <div className={styles.modalContent}>
        <h2 id={headingId} className={styles.modalText}>
          {text}
        </h2>
        <div className={styles.modalActions}>
          <button
            ref={declineRef}
            className={styles.modalButton}
            type="button"
            onClick={onDecline}
          >
            {noLabel}
          </button>
          <button
            ref={acceptRef}
            className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
            type="button"
            onClick={onAccept}
          >
            {yesLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
