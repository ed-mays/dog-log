// A tiny helper to mock Zustand selector hooks in tests.
// It supports both static state objects and state factory functions for dynamic updates.
// Usage:
//   (useStore as vi.Mock).mockImplementation(makeZustandSelectorMock(state))
//   // or for dynamic state:
//   (useStore as vi.Mock).mockImplementation(makeZustandSelectorMock(() => ({
//     items: itemsRef.current,
//     action: vi.fn(...)
//   })))

export type StateOrFactory<TState> = TState | (() => TState);

export function makeZustandSelectorMock<TState>(
  stateOrFactory: StateOrFactory<TState>
) {
  return (selector?: (s: TState) => unknown) => {
    const state =
      typeof stateOrFactory === 'function'
        ? (stateOrFactory as () => TState)()
        : (stateOrFactory as TState);
    return selector ? selector(state) : state;
  };
}
