import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { applyTheme, initialTheme, useTheme } from '../apps/lite/src/theme';

it('starts and toggles even when storage access throws', () => {
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new DOMException('Blocked', 'SecurityError');
  });
  vi.mocked(window.matchMedia).mockReturnValue({
    matches: true,
  } as MediaQueryList);
  expect(initialTheme()).toBe('dark');
  expect(() => applyTheme(initialTheme())).not.toThrow();
  const { result } = renderHook(useTheme);
  act(() => result.current[1]());
  expect(result.current[0]).toBe('light');
  expect(document.documentElement.classList.contains('dark')).toBe(false);
});

it('keeps the new theme if saving a preference fails', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('light');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Full', 'QuotaExceededError');
  });
  const { result } = renderHook(useTheme);
  act(() => result.current[1]());
  expect(result.current[0]).toBe('dark');
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});
