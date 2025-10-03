import { getRelativeTime } from './dateUtils';

describe('dateUtils', () => {
  describe('getRelativeTime', () => {
    test('should return "a few seconds ago" for recent dates', () => {
      const now = new Date();
      const result = getRelativeTime(now.toISOString());
      expect(result).toBe('a few seconds ago');
    });

    test('should return minutes ago', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 5);
      const result = getRelativeTime(date.toISOString());
      expect(result).toBe('5 minutes ago');
    });

    test('should return 1 minute ago (singular)', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 1);
      const result = getRelativeTime(date.toISOString());
      expect(result).toBe('1 minute ago');
    });

    test('should return hours ago', () => {
      const date = new Date();
      date.setHours(date.getHours() - 3);
      const result = getRelativeTime(date.toISOString());
      expect(result).toBe('3 hours ago');
    });

    test('should return days ago', () => {
      const date = new Date();
      date.setDate(date.getDate() - 5);
      const result = getRelativeTime(date.toISOString());
      expect(result).toBe('5 days ago');
    });

    test('should return months ago', () => {
      const date = new Date();
      date.setMonth(date.getMonth() - 3);
      const result = getRelativeTime(date.toISOString());
      expect(result).toBe('3 months ago');
    });

    test('should return years ago', () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 2);
      const result = getRelativeTime(date.toISOString());
      expect(result).toBe('2 years ago');
    });
  });
});
