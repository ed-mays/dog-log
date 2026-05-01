import { render, screen, within } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeSelector } from './ThemeSelector';
import { useThemeStore } from '@store/theme.store';
import * as featureFlagsHooks from '@featureFlags/hooks/useFeatureFlag';

const useFeatureFlagSpy = vi.spyOn(featureFlagsHooks, 'useFeatureFlag');

describe('ThemeSelector', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'light' });
    vi.clearAllMocks();
  });

  it('renders nothing when feature flag is disabled', () => {
    useFeatureFlagSpy.mockReturnValue(false);
    render(<ThemeSelector />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders an anchor button when feature flag is enabled', () => {
    useFeatureFlagSpy.mockReturnValue(true);
    render(<ThemeSelector />);
    expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument();
  });

  it('opens a menu with three options when clicked', async () => {
    useFeatureFlagSpy.mockReturnValue(true);
    const user = userEvent.setup();
    render(<ThemeSelector />);

    await user.click(screen.getByRole('button', { name: /theme/i }));

    const menu = await screen.findByRole('menu', { name: /theme/i });
    const items = within(menu).getAllByRole('menuitemradio');
    expect(items).toHaveLength(3);
    expect(within(menu).getByText('Light')).toBeInTheDocument();
    expect(within(menu).getByText('Dark')).toBeInTheDocument();
    expect(within(menu).getByText('Caregiver')).toBeInTheDocument();
  });

  it('marks the current mode with aria-checked=true', async () => {
    useFeatureFlagSpy.mockReturnValue(true);
    useThemeStore.setState({ mode: 'caregiver' });
    const user = userEvent.setup();
    render(<ThemeSelector />);

    await user.click(screen.getByRole('button', { name: /theme/i }));

    const menu = await screen.findByRole('menu', { name: /theme/i });
    const caregiverItem = within(menu).getByRole('menuitemradio', {
      name: /caregiver/i,
    });
    expect(caregiverItem).toBeChecked();
    const lightItem = within(menu).getByRole('menuitemradio', {
      name: /light/i,
    });
    expect(lightItem).not.toBeChecked();
  });

  it('sets the chosen mode and closes the menu when an item is picked', async () => {
    useFeatureFlagSpy.mockReturnValue(true);
    const user = userEvent.setup();
    render(<ThemeSelector />);

    await user.click(screen.getByRole('button', { name: /theme/i }));
    const caregiverItem = await screen.findByRole('menuitemradio', {
      name: /caregiver/i,
    });
    await user.click(caregiverItem);

    expect(useThemeStore.getState().mode).toBe('caregiver');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
