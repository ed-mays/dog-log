import { render, screen } from '@testing-library/react';
import { NavigationBar } from './NavigationBar';

describe('NavigationBar', () => {
  it('renders with default props', () => {
    render(<NavigationBar />);
    const navigationBar = screen.getByTestId('loading-indicator');
    expect(navigationBar).toBeInTheDocument();
    expect(navigationBar).toHaveTextContent('Navigation Bar');
    expect(navigationBar).toHaveAttribute('role', 'status');
    expect(navigationBar).toHaveAttribute('aria-live', 'polite');
  });

  it('renders with custom text', () => {
    render(<NavigationBar text="Custom Text" />);
    const navigationBar = screen.getByText('Custom Text');
    expect(navigationBar).toBeInTheDocument();
  });

  it('renders with a custom role', () => {
    render(<NavigationBar role="navigation" />);
    const navigationBar = screen.getByRole('navigation');
    expect(navigationBar).toBeInTheDocument();
  });

  it('renders with a custom aria-live attribute', () => {
    render(<NavigationBar ariaLive="assertive" />);
    const navigationBar = screen.getByTestId('loading-indicator');
    expect(navigationBar).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders with a custom data-testid', () => {
    render(<NavigationBar data-testid="custom-testid" />);
    const navigationBar = screen.getByTestId('custom-testid');
    expect(navigationBar).toBeInTheDocument();
  });
});
