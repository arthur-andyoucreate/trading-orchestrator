/**
 * Utility Functions Tests
 */

import {
  cn,
  formatCurrency,
  formatPercent,
  formatNumber,
  formatRelativeTime,
  debounce,
  throttle,
} from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should merge Tailwind classes correctly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });
  });

  describe('formatCurrency', () => {
    it('should format positive numbers', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format negative numbers', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('should respect decimal places', () => {
      expect(formatCurrency(1234.5678, 4)).toBe('$1,234.5678');
    });

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1234567890)).toBe('$1,234,567,890.00');
    });
  });

  describe('formatPercent', () => {
    it('should format positive percentages with plus sign', () => {
      expect(formatPercent(5.5)).toBe('+5.50%');
    });

    it('should format negative percentages', () => {
      expect(formatPercent(-3.2)).toBe('-3.20%');
    });

    it('should format zero', () => {
      expect(formatPercent(0)).toBe('+0.00%');
    });

    it('should respect decimal places', () => {
      expect(formatPercent(5.5678, 3)).toBe('+5.568%');
    });
  });

  describe('formatNumber', () => {
    it('should format billions', () => {
      expect(formatNumber(1500000000)).toBe('1.50B');
    });

    it('should format millions', () => {
      expect(formatNumber(2500000)).toBe('2.50M');
    });

    it('should format thousands', () => {
      expect(formatNumber(5000)).toBe('5.00K');
    });

    it('should format small numbers directly', () => {
      expect(formatNumber(123.45)).toBe('123.45');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1500000)).toBe('-1.50M');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format just now', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('should format minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
    });

    it('should format hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
    });

    it('should format days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
    });

    it('should format old dates', () => {
      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const formatted = formatRelativeTime(oldDate);
      // Should be a date string
      expect(formatted).not.toContain('ago');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the debounced function', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('arg1', 'arg2');

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    jest.useRealTimers();
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    it('should throttle function calls', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);

      throttledFn();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });
});
