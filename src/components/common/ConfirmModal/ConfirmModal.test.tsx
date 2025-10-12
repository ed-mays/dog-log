import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  const text = 'Are you sure you want to discard changes?';
  let onAccept: () => void;
  let onDecline: () => void;

  beforeEach(() => {
    onAccept = vi.fn();
    onDecline = vi.fn();
  });

  // TODO: Implement test for i18n on default button labels for en and es locales
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

  it('calls onAccept when the "Yes" button is clicked (default)', async () => {
    render(
      <ConfirmModal text={text} onAccept={onAccept} onDecline={onDecline} />
    );
    await userEvent.click(screen.getByText('Yes'));
    expect(onAccept).toHaveBeenCalled();
  });

  it('calls onDecline when the "No" button is clicked (default)', async () => {
    render(
      <ConfirmModal text={text} onAccept={onAccept} onDecline={onDecline} />
    );
    await userEvent.click(screen.getByText('No'));
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

  it('calls onAccept when custom accept label is clicked', async () => {
    render(
      <ConfirmModal
        text={text}
        onAccept={onAccept}
        onDecline={onDecline}
        acceptLabel="Sim"
        declineLabel="Não"
      />
    );
    await userEvent.click(screen.getByText('Sim'));
    expect(onAccept).toHaveBeenCalled();
  });

  it('calls onDecline when custom decline label is clicked', async () => {
    render(
      <ConfirmModal
        text={text}
        onAccept={onAccept}
        onDecline={onDecline}
        acceptLabel="Oui"
        declineLabel="Non"
      />
    );
    await userEvent.click(screen.getByText('Non'));
    expect(onDecline).toHaveBeenCalled();
  });

  it('focuses the decline button initially and traps focus between buttons when tabbing', async () => {
    render(
      <ConfirmModal
        text={text}
        onAccept={onAccept}
        onDecline={onDecline}
        acceptLabel="Yes"
        declineLabel="No"
      />
    );

    const declineBtn = screen.getByRole('button', { name: 'No' });
    const acceptBtn = screen.getByRole('button', { name: 'Yes' });

    expect(declineBtn).toHaveFocus();

    // Tab moves to accept
    await userEvent.tab();
    expect(acceptBtn).toHaveFocus();

    // Tab again wraps to decline
    await userEvent.tab();
    expect(declineBtn).toHaveFocus();

    // Shift+Tab from decline wraps to accept
    await userEvent.tab({ shift: true });
    expect(acceptBtn).toHaveFocus();
  });

  it('closes (calls onDecline) on Escape key', async () => {
    render(
      <ConfirmModal
        text={text}
        onAccept={onAccept}
        onDecline={onDecline}
        acceptLabel="Yes"
        declineLabel="No"
      />
    );

    // Send Escape
    await userEvent.keyboard('{Escape}');
    expect(onDecline).toHaveBeenCalled();
  });
});
