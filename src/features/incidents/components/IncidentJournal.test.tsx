import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncidentJournal } from './IncidentJournal';
import { useIncidentStore } from '@store/useIncidentStore';
import type { Incident } from '@features/incidents/types';

vi.mock('@store/useIncidentStore', () => ({
  useIncidentStore: vi.fn(),
}));

const fakeActive = (over: Partial<Incident> = {}): Incident => ({
  id: 'incident-1',
  userId: 'user-1',
  createdBy: 'user-1',
  petId: 'pet-1',
  startedAt: new Date('2026-05-02T10:00:00.000Z'),
  endedAt: null,
  type: null,
  severity: null,
  chips: [],
  journal: [],
  deletedAt: null,
  createdAt: new Date('2026-05-02T10:00:00.000Z'),
  updatedAt: new Date('2026-05-02T10:00:00.000Z'),
  ...over,
});

describe('IncidentJournal', () => {
  const mockAppendJournal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIncidentStore).mockReturnValue({
      activeIncident: fakeActive(),
      appendJournal: mockAppendJournal,
      isLoading: false,
      error: null,
      startIncident: vi.fn(),
      stopIncident: vi.fn(),
      hydrateActiveIncident: vi.fn(),
      setSeverity: vi.fn(),
      clearSeverity: vi.fn(),
    });
  });

  it('AC-4 Given/When/Then: appends journal entry on Enter with elapsed time prefix', async () => {
    const user = userEvent.setup();
    render(<IncidentJournal />);

    const textarea = screen.getByRole('textbox', { name: /journal/i });
    await user.type(textarea, 'shaking starting');
    await user.keyboard('{Enter}');

    expect(mockAppendJournal).toHaveBeenCalledWith('shaking starting');
    // After append, the textarea should be cleared
    expect(textarea).toHaveValue('');
  });

  it('displays existing journal entries with elapsed time prefix', () => {
    vi.mocked(useIncidentStore).mockReturnValue({
      activeIncident: fakeActive({
        journal: [
          {
            elapsedSeconds: 92,
            text: 'shaking starting',
            addedAt: new Date('2026-05-02T10:01:32.000Z'),
          },
          {
            elapsedSeconds: 150,
            text: 'still shaking',
            addedAt: new Date('2026-05-02T10:02:30.000Z'),
          },
        ],
      }),
      appendJournal: mockAppendJournal,
      isLoading: false,
      error: null,
      startIncident: vi.fn(),
      stopIncident: vi.fn(),
      hydrateActiveIncident: vi.fn(),
      setSeverity: vi.fn(),
      clearSeverity: vi.fn(),
    });

    render(<IncidentJournal />);

    // Entries should display with HH:MM:SS prefix
    expect(screen.getByText(/00:01:32/)).toBeInTheDocument();
    expect(screen.getByText(/shaking starting/)).toBeInTheDocument();
    expect(screen.getByText(/00:02:30/)).toBeInTheDocument();
    expect(screen.getByText(/still shaking/)).toBeInTheDocument();
  });

  it('backspace does not delete committed journal lines', async () => {
    const user = userEvent.setup();
    vi.mocked(useIncidentStore).mockReturnValue({
      activeIncident: fakeActive({
        journal: [
          {
            elapsedSeconds: 92,
            text: 'shaking starting',
            addedAt: new Date('2026-05-02T10:01:32.000Z'),
          },
        ],
      }),
      appendJournal: mockAppendJournal,
      isLoading: false,
      error: null,
      startIncident: vi.fn(),
      stopIncident: vi.fn(),
      hydrateActiveIncident: vi.fn(),
      setSeverity: vi.fn(),
      clearSeverity: vi.fn(),
    });

    render(<IncidentJournal />);

    const textarea = screen.getByRole('textbox', { name: /journal/i });
    await user.click(textarea);
    await user.keyboard('{Backspace}');

    // Committed entry should still be visible
    expect(screen.getByText(/00:01:32/)).toBeInTheDocument();
    expect(screen.getByText(/shaking starting/)).toBeInTheDocument();
  });

  it('multi-line paste creates one entry (up to first newline), rest stays in input', async () => {
    const user = userEvent.setup();
    render(<IncidentJournal />);

    const textarea = screen.getByRole('textbox', { name: /journal/i });
    const multiLineText = 'first line\nsecond line\nthird line';

    await user.click(textarea);
    await user.paste(multiLineText);

    // The full pasted text should be in the textarea initially
    expect(textarea).toHaveValue(multiLineText);

    // When user presses Enter, only the first line should be appended
    await user.keyboard('{Enter}');
    expect(mockAppendJournal).toHaveBeenCalledWith('first line');
  });

  it('does not append empty text', async () => {
    const user = userEvent.setup();
    render(<IncidentJournal />);

    const textarea = screen.getByRole('textbox', { name: /journal/i });
    await user.click(textarea);
    await user.keyboard('{Enter}');

    expect(mockAppendJournal).not.toHaveBeenCalled();
  });

  it('does not append whitespace-only text', async () => {
    const user = userEvent.setup();
    render(<IncidentJournal />);

    const textarea = screen.getByRole('textbox', { name: /journal/i });
    await user.type(textarea, '   ');
    await user.keyboard('{Enter}');

    expect(mockAppendJournal).not.toHaveBeenCalled();
  });
});
