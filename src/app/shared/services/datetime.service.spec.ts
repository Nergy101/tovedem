import { TestBed } from '@angular/core/testing';
import { DateTimeService } from './datetime.service';

/**
 * Tests for UTC → Amsterdam timezone conversion.
 * These define the expected behavior that pb_hooks/mailing.js must match
 * when using PocketBase's DateTime + Timezone for email formatting.
 *
 * Covers: CET/CEST DST, PocketBase formats (space, with/without Z),
 * and the exact "weekday day month year" format used in reservation emails.
 */
describe('DateTimeService', () => {
  let service: DateTimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateTimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('formatTime - UTC to Amsterdam (HH:mm)', () => {
    it('should convert 18:00 UTC to 20:00 in summer (CEST)', () => {
      expect(service.formatTime('2026-06-15T18:00:00.000Z')).toBe('20:00');
    });

    it('should convert 18:00 UTC to 19:00 in winter (CET)', () => {
      expect(service.formatTime('2026-12-15T18:00:00.000Z')).toBe('19:00');
    });

    it('should convert 18:00 UTC to 19:00 in March before DST (CET)', () => {
      expect(service.formatTime('2026-03-15T18:00:00.000Z')).toBe('19:00');
    });

    it('should convert 16:00 UTC to 18:00 in March after DST switch (CEST)', () => {
      expect(service.formatTime('2026-03-31T16:00:00.000Z')).toBe('18:00');
    });
  });

  describe('formatTime - PocketBase formats (space, with/without Z)', () => {
    it('should parse "YYYY-MM-DD HH:mm:ss.000Z" and convert to Amsterdam time', () => {
      expect(service.formatTime('2026-06-15 18:00:00.000Z')).toBe('20:00');
    });

    it('should parse "YYYY-MM-DD HH:mm:ss" without Z (treat as UTC) and convert to Amsterdam time', () => {
      expect(service.formatTime('2026-04-24 18:00:00')).toBe('20:00');
    });

    it('should parse "2026-04-24 18:00:00" as April 24 20:00 Amsterdam (CEST)', () => {
      expect(service.formatTime('2026-04-24 18:00:00')).toBe('20:00');
    });
  });

  describe('formatFullDateWithWeekday - mailing format (weekday day month year)', () => {
    it('should format as "vrijdag 24 april 2026" for 2026-04-24 18:00 UTC', () => {
      expect(service.formatFullDateWithWeekday('2026-04-24 18:00:00')).toBe(
        'vrijdag 24 april 2026'
      );
    });

    it('should format as "vrijdag 24 april 2026" for ISO format with Z', () => {
      expect(service.formatFullDateWithWeekday('2026-04-24T18:00:00.000Z')).toBe(
        'vrijdag 24 april 2026'
      );
    });

    it('should format with Dutch month and weekday for June date', () => {
      const result = service.formatFullDateWithWeekday('2026-06-15T18:00:00.000Z');
      expect(result).toContain('juni');
      expect(result).toContain('2026');
      expect(result).toMatch(/^\w+ \d+ juni 2026$/);
    });
  });

  describe('formatDate - Dutch date format', () => {
    it('should format date with Dutch month and year', () => {
      const result = service.formatDate('2026-06-15T18:00:00.000Z', 'd LLLL yyyy', 'nl');
      expect(result).toContain('juni');
      expect(result).toContain('2026');
    });
  });

  describe('formatTime - edge cases', () => {
    it('should return empty string for null', () => {
      expect(service.formatTime(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(service.formatTime(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(service.formatTime('')).toBe('');
    });
  });

  describe('formatDate - edge cases', () => {
    it('should return empty string for null', () => {
      expect(service.formatDate(null, 'dd LLLL yyyy')).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(service.formatDate(undefined, 'dd LLLL yyyy')).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(service.formatDate('', 'dd LLLL yyyy')).toBe('');
    });
  });

  describe('formatFullDateWithWeekday - edge cases', () => {
    it('should return empty string for null', () => {
      expect(service.formatFullDateWithWeekday(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(service.formatFullDateWithWeekday(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(service.formatFullDateWithWeekday('')).toBe('');
    });
  });
});
