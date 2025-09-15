import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  const text = 'Are you sure you want to discard changes?';
  let onAccept: () => void;
  let onDecline: () => void;

  beforeEach(() => {
    onAccept = vi.fn();
    onDecline = vi.fn();
  });

  it('renders the modal text', () => {
    render(
      <ConfirmModal text={text} onAccept={onAccept} onDecline={onDecline} />
    );
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('renders default button labels "Yes" (accept) and "No" (decline)', () => {
    render(
      <ConfirmModal text={text} onAccept={onAccept} onDecline={onDecline} />
    );
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('calls onAccept when the "Yes" button is clicked (default)', () => {
    render(
      <ConfirmModal text={text} onAccept={onAccept} onDecline={onDecline} />
    );
    fireEvent.click(screen.getByText('Yes'));
    expect(onAccept).toHaveBeenCalled();
  });

  it('calls onDecline when the "No" button is clicked (default)', () => {
    render(
      <ConfirmModal text={text} onAccept={onAccept} onDecline={onDecline} />
    );
    fireEvent.click(screen.getByText('No'));
    expect(onDecline).toHaveBeenCalled();
  });

  it('renders and uses custom accept/decline labels', () => {
    render(
      <ConfirmModal
        text={text}
        onAccept={onAccept}
        onDecline={onDecline}
        acceptLabel="Aceptar"
        declineLabel="Cancelar"
      />
    );
    expect(screen.getByText('Aceptar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('calls onAccept when custom accept label is clicked', () => {
    render(
      <ConfirmModal
        text={text}
        onAccept={onAccept}
        onDecline={onDecline}
        acceptLabel="Sim"
        declineLabel="Não"
      />
    );
    fireEvent.click(screen.getByText('Sim'));
    expect(onAccept).toHaveBeenCalled();
  });

  it('calls onDecline when custom decline label is clicked', () => {
    render(
      <ConfirmModal
        text={text}
        onAccept={onAccept}
        onDecline={onDecline}
        acceptLabel="Oui"
        declineLabel="Non"
      />
    );
    fireEvent.click(screen.getByText('Non'));
    expect(onDecline).toHaveBeenCalled();
  });
});
