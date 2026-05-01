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

  it('should set mode to dark', () => {
    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('should set mode to caregiver', () => {
    useThemeStore.getState().setMode('caregiver');
    expect(useThemeStore.getState().mode).toBe('caregiver');
  });

  it('should cycle modes light -> dark -> caregiver -> light', () => {
    useThemeStore.getState().cycleMode();
    expect(useThemeStore.getState().mode).toBe('dark');
    useThemeStore.getState().cycleMode();
    expect(useThemeStore.getState().mode).toBe('caregiver');
    useThemeStore.getState().cycleMode();
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('should persist mode to localStorage', () => {
    useThemeStore.getState().setMode('caregiver');
    const storage = JSON.parse(localStorage.getItem('theme-storage') || '{}');
    expect(storage.state.mode).toBe('caregiver');
  });
});
