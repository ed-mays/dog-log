import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@test-utils';

// ADR-019 Default Pattern: Mock the auth store at module scope and drive state via variables
let initAuthListenerMock: ReturnType<typeof vi.fn> = vi.fn();

type AuthStateSlice = {
  initAuthListener: () => void;
};

vi.mock('@store/auth.store.ts', () => ({
  useAuthStore: vi.fn((selector?: (s: AuthStateSlice) => unknown) => {
    const slice: AuthStateSlice = { initAuthListener: initAuthListenerMock };
    return typeof selector === 'function' ? selector(slice) : slice;
  }),
}));

// Import after mocks so the component receives mocked modules per ADR-019
import AuthBootstrap from './AuthBootstrap';

describe('AuthBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initAuthListenerMock = vi.fn();
  });

  it('calls initAuthListener once on mount', () => {
    render(<AuthBootstrap />);
    expect(initAuthListenerMock).toHaveBeenCalledTimes(1);
  });

  it('does not re-initialize on re-render', () => {
    const { rerender } = render(<AuthBootstrap />);
    expect(initAuthListenerMock).toHaveBeenCalledTimes(1);

    // Re-render with the same component — effect should not run again unnecessarily
    rerender(<AuthBootstrap />);
    expect(initAuthListenerMock).toHaveBeenCalledTimes(1);
  });

  it('returns no UI (renders null)', () => {
    const { container } = render(<AuthBootstrap />);
    // The component returns null, so the container should be empty
    expect(container).toBeEmptyDOMElement();
  });
});
