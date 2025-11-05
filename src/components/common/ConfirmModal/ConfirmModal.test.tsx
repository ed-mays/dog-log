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
  it('renders the modal text and ARIA attributes', () => {
    render(
      <ConfirmModal text={text} onAccept={onAccept} onDecline={onDecline} />
    );

    // Dialog has the correct role, accessible name (via heading), and aria-modal
    const dialog = screen.getByRole('dialog', { name: text });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Heading is present and labelled by is wired (implicitly via accessible name)
    expect(screen.getByRole('heading', { name: text })).toBeInTheDocument();
  });

  it('renders default button labels "Yes" (accept) and "No" (decline)', () => {
    render(
      <ConfirmModal text={text} onAccept={onAccept} onDecline={onDecline} />
    );
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it('calls onAccept when the "Yes" button is clicked (default)', async () => {
    render(
      <ConfirmModal text={text} onAccept={onAccept} onDecline={onDecline} />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onAccept).toHaveBeenCalled();
  });

  it('calls onDecline when the "No" button is clicked (default)', async () => {
    render(
      <ConfirmModal text={text} onAccept={onAccept} onDecline={onDecline} />
    );
    await userEvent.click(screen.getByRole('button', { name: 'No' }));
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
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cancelar' })
    ).toBeInTheDocument();
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
    await userEvent.click(screen.getByRole('button', { name: 'Sim' }));
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
    await userEvent.click(screen.getByRole('button', { name: 'Non' }));
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

  it('supports keyboard activation with Enter and Space', async () => {
    render(
      <ConfirmModal text={text} onAccept={onAccept} onDecline={onDecline} />
    );

    const declineBtn = screen.getByRole('button', { name: 'No' });
    const acceptBtn = screen.getByRole('button', { name: 'Yes' });

    // Initial focus on decline, activate via Enter and Space
    expect(declineBtn).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onDecline).toHaveBeenCalledTimes(2);

    // Move focus to accept and activate via Enter and Space
    await userEvent.tab();
    expect(acceptBtn).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onAccept).toHaveBeenCalledTimes(2);
  });

  test('renders an error alert when error prop is provided', () => {
    const errorText = 'Something went wrong';
    render(
      <ConfirmModal
        text={text}
        onAccept={onAccept}
        onDecline={onDecline}
        error={errorText}
      />
    );
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(errorText);
  });

  test('ignores backdrop clicks (does not call onDecline) and remains open', async () => {
    render(
      <ConfirmModal text={text} onAccept={onAccept} onDecline={onDecline} />
    );

    // Backdrop is rendered with role="presentation" by MUI Backdrop
    const backdrop = screen.getByTestId('dialog-backdrop');
    await userEvent.click(backdrop);

    // onDecline should NOT be called for backdrop clicks per implementation
    expect(onDecline).not.toHaveBeenCalled();
    // Dialog remains open because parent controls visibility and component always renders it with open
    expect(screen.getByRole('dialog', { name: text })).toBeInTheDocument();
  });
});

import { withLocale } from '@test-utils';
import i18n from '@testUtils/test-i18n';

// i18n tests for default button labels (en, es)
describe('ConfirmModal i18n defaults', () => {
  test('uses localized default button labels in English', async () => {
    await withLocale('en', async () => {
      const text = 'Are you sure?';
      render(
        <ConfirmModal text={text} onAccept={vi.fn()} onDecline={vi.fn()} />
      );

      const yesLabel = i18n.t('responses.yes', {
        ns: 'common',
        defaultValue: 'Yes',
      });
      const noLabel = i18n.t('responses.no', {
        ns: 'common',
        defaultValue: 'No',
      });

      expect(
        await screen.findByRole('button', { name: yesLabel })
      ).toBeInTheDocument();
      expect(
        await screen.findByRole('button', { name: noLabel })
      ).toBeInTheDocument();
    });
  });

  test('uses localized default button labels in Spanish', async () => {
    await withLocale('es', async () => {
      const text = '¿Seguro?';
      render(
        <ConfirmModal text={text} onAccept={vi.fn()} onDecline={vi.fn()} />
      );

      const yesLabel = i18n.t('responses.yes', {
        ns: 'common',
        defaultValue: 'Sí',
      });
      const noLabel = i18n.t('responses.no', {
        ns: 'common',
        defaultValue: 'No',
      });

      expect(
        await screen.findByRole('button', { name: yesLabel })
      ).toBeInTheDocument();
      expect(
        await screen.findByRole('button', { name: noLabel })
      ).toBeInTheDocument();
    });
  });
});
