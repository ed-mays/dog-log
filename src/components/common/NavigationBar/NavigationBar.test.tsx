import { render, screen } from '@test-utils';
import { NavigationBar } from './NavigationBar';
import { within } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { installAuthStoreMock } from '@testUtils/mocks/mockStoreInstallers';

// Standardized store mock stub for components that read from the auth store
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  // Default: not initializing; no-op actions unless a test overrides
  installAuthStoreMock({ initializing: false });
});

describe('NavigationBar', () => {
  it('renders without crashing in a Router context', () => {
    render(<NavigationBar />);
    // No assertions yet; smoke render only.
  });

  it('renders a fixed primary navigation bar with brand', () => {
    render(<NavigationBar />);

    // The nav container
    const nav = screen.getByRole('navigation', { name: /primary/i });
    expect(nav).toBeInTheDocument();

    // Brand heading text
    const heading = within(nav).getByRole('heading', { name: /dog log/i });
    expect(heading).toBeInTheDocument();

    // Brand acts as a home link (optional but recommended)
    const brandLink = within(nav).getByRole('link', { name: /dog log/i });
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('renders a link to the Pets page', () => {
    render(<NavigationBar />);
    const link = screen.getByRole('link', { name: /pets/i });
    expect(link).toHaveAttribute('href', '/pets');
  });

  it('renders a Language Selector in the navigation bar', async () => {
    render(<NavigationBar />);
    // MUI Select is exposed as combobox
    const selector = await screen.findByRole('combobox', { name: /language/i });
    expect(selector).toBeInTheDocument();
  });

  it('renders the LogoutButton in the navigation bar', async () => {
    render(<NavigationBar />);
    const logoutButton = await screen.findByTestId('logout-button');
    expect(logoutButton).toBeInTheDocument();
  });

  it('navigation has aria-label Primary', () => {
    render(<NavigationBar />);
    const nav = screen.getByRole('navigation', { name: /primary/i });
    expect(nav).toBeInTheDocument();
  });

  it('brand and Pets links are visible and focusable', () => {
    render(<NavigationBar />);
    const brand = screen.getByRole('link', { name: /dog log/i });
    const pets = screen.getByRole('link', { name: /pets/i });
    expect(brand).toBeVisible();
    expect(pets).toBeVisible();
  });
});
