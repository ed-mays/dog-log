import { act } from 'react';
import { useAppStore } from './store';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset the state between tests
    useAppStore.setState({ count: 0 });
  });

  it('initializes count to 0', () => {
    expect(useAppStore.getState().count).toBe(0);
  });

  it('increments count', () => {
    act(() => {
      useAppStore.getState().increment();
    });
    expect(useAppStore.getState().count).toBe(1);
  });

  it('decrements count', () => {
    act(() => {
      useAppStore.getState().decrement();
    });
    expect(useAppStore.getState().count).toBe(-1);
  });
});
