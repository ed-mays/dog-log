interface ConfirmModalProps {
  text: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function ConfirmModal({ text, onAccept, onDecline }: ConfirmModalProps) {
  return (
    <div role="dialog" aria-modal="true">
      <p>{text}</p>
      <button onClick={onAccept}>Yes</button>
      <button onClick={onDecline}>No</button>
    </div>
  );
}
