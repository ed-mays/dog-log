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

  it('calls onAccept when Accept button is clicked', () => {
    render(
      <ConfirmModal text={text} onAccept={onAccept} onDecline={onDecline} />
    );
    fireEvent.click(screen.getByText(/Yes/i));
    expect(onAccept).toHaveBeenCalled();
  });

  it('calls onDecline when Decline button is clicked', () => {
    render(
      <ConfirmModal text={text} onAccept={onAccept} onDecline={onDecline} />
    );
    fireEvent.click(screen.getByText(/No/i));
    expect(onDecline).toHaveBeenCalled();
  });
});
