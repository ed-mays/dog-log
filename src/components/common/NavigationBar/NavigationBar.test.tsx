import { render, screen } from '@test-utils';
import { NavigationBar } from './NavigationBar';
import { within } from '@testing-library/react';

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
  it('renders the LogoutButton in the navigation bar', async () => {
    render(<NavigationBar />);
    const logoutButton = await screen.findByTestId('logout-button');
    expect(logoutButton).toBeInTheDocument();
  });
  it.todo('navigation has aria-label Primary', () => {});
  it.todo('brand and Pets links are visible and focusable', () => {});
});
