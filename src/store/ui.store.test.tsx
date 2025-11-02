import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from './ui.store';

describe('useUiStore', () => {
  beforeEach(() => {
    // reset to initial state defined in the store
    useUiStore.setState({ loading: false, error: null });
  });

  it('initial state is loading=false, error=null', () => {
    const { loading, error } = useUiStore.getState();
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });

  it('setLoading updates loading state', () => {
    useUiStore.getState().setLoading(true);
    expect(useUiStore.getState().loading).toBe(true);
    useUiStore.getState().setLoading(false);
    expect(useUiStore.getState().loading).toBe(false);
  });

  it('setError updates error state', () => {
    const e = new Error('oops');
    useUiStore.getState().setError(e);
    expect(useUiStore.getState().error).toBe(e);
    useUiStore.getState().setError(null);
    expect(useUiStore.getState().error).toBeNull();
  });

  it('reset restores initial state', () => {
    useUiStore.setState({ loading: true, error: new Error('x') });
    useUiStore.getState().reset();
    const { loading, error } = useUiStore.getState();
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });
});
