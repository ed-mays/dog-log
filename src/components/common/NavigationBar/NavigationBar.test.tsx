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
});
