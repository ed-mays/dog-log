import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from './theme.store';

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'light' });
    localStorage.clear();
  });

  it('should initialize with light mode', () => {
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('should set mode', () => {
    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('should toggle mode', () => {
    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().mode).toBe('dark');
    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('should persist mode to localStorage', () => {
    useThemeStore.getState().setMode('dark');
    const storage = JSON.parse(localStorage.getItem('theme-storage') || '{}');
    expect(storage.state.mode).toBe('dark');
  });
});
