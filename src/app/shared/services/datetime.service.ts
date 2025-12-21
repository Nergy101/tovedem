import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';

/**
 * Centralized service for all datetime operations with proper timezone handling.
 * All dates in PocketBase are stored as UTC. This service ensures they are
 * correctly converted to/from Europe/Amsterdam local time, respecting DST
 * for the specific date being processed (not the current date).
 */
@Injectable({
  providedIn: 'root',
})
export class DateTimeService {
  /**
   * The timezone used for all conversions.
   * Hardcoded as requested, but can be made configurable later.
   */
  private readonly TIMEZONE = 'Europe/Amsterdam';

  /**
   * Convert a UTC datetime string to a Luxon DateTime in Amsterdam timezone.
   * This correctly handles DST for the target date.
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @returns Luxon DateTime in Europe/Amsterdam timezone
   */
  toAmsterdamTime(utcString: string | null | undefined): DateTime | null {
    console.log('utcString', utcString);
    if (!utcString) return null;

    // Normalize the string: replace space with 'T' to make it valid ISO 8601
    // Handles formats like "2026-03-06 19:00:00.000Z" -> "2026-03-06T19:00:00.000Z"
    const normalizedString = utcString.replace(' ', 'T');

    // Parse as UTC and convert to Amsterdam timezone
    const dt = DateTime.fromISO(normalizedString, { zone: 'utc' });
    console.log('dt', dt, 'isValid', dt.isValid);
    if (!dt.isValid) return null;

    return dt.setZone(this.TIMEZONE);
  }

  /**
   * Convert a local date and time (entered by user in Amsterdam) to UTC ISO string.
   * This is used when saving dates to PocketBase.
   *
   * @param date - JavaScript Date from datepicker (represents the date part)
   * @param time - Time string in HH:mm format (24-hour)
   * @returns ISO datetime string in UTC for storage
   */
  toUTC(date: Date | null, time: string | null): string | null {
    if (!date || !time) return null;

    // Parse the time string
    const timeMatch = time.match(/^(\d{2}):(\d{2})$/);
    if (!timeMatch) return null;

    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);

    // Create a DateTime in Amsterdam timezone with the user's intended local time
    // This correctly interprets the date/time as Amsterdam local time
    const amsterdamDt = DateTime.fromObject(
      {
        year: date.getFullYear(),
        month: date.getMonth() + 1, // Luxon months are 1-based
        day: date.getDate(),
        hour: hours,
        minute: minutes,
        second: 0,
        millisecond: 0,
      },
      { zone: this.TIMEZONE }
    );

    if (!amsterdamDt.isValid) return null;

    // Convert to UTC and return ISO string
    return amsterdamDt.toUTC().toISO();
  }

  /**
   * Format a UTC datetime string as Amsterdam local time.
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @param format - Luxon format string (e.g., 'dd LLLL yyyy', 'HH:mm')
   * @param locale - Locale for formatting (default: nl)
   * @returns Formatted string in Amsterdam timezone
   */
  formatDate(
    utcString: string | null | undefined,
    format: string,
    locale = 'nl'
  ): string {
    const dt = this.toAmsterdamTime(utcString);
    if (!dt) return '';

    return dt.setLocale(locale).toFormat(format);
  }

  /**
   * Format just the time portion of a UTC datetime.
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @returns Time in HH:mm format (Amsterdam timezone)
   */
  formatTime(utcString: string | null | undefined): string {
    return this.formatDate(utcString, 'HH:mm');
  }

  /**
   * Format date as "d LLLL" (e.g., "10 januari") in Amsterdam timezone.
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @returns Formatted date string
   */
  formatDayMonth(utcString: string | null | undefined): string {
    return this.formatDate(utcString, 'd LLLL');
  }

  /**
   * Format date as "dd LLLL yyyy" (e.g., "10 januari 2026") in Amsterdam timezone.
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @returns Formatted date string
   */
  formatFullDate(utcString: string | null | undefined): string {
    return this.formatDate(utcString, 'dd LLLL yyyy');
  }

  /**
   * Get just the day number from a UTC datetime.
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @returns Day of month as string (e.g., "10")
   */
  formatDay(utcString: string | null | undefined): string {
    return this.formatDate(utcString, 'd');
  }

  /**
   * Get the month name from a UTC datetime.
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @returns Month name (e.g., "januari")
   */
  formatMonth(utcString: string | null | undefined): string {
    return this.formatDate(utcString, 'LLLL');
  }

  /**
   * Get the year from a UTC datetime.
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @returns Year as string (e.g., "2026")
   */
  formatYear(utcString: string | null | undefined): string {
    return this.formatDate(utcString, 'yyyy');
  }

  /**
   * Check if a UTC datetime represents today in Amsterdam timezone.
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @returns true if the date is today in Amsterdam
   */
  isToday(utcString: string | null | undefined): boolean {
    const dt = this.toAmsterdamTime(utcString);
    if (!dt) return false;

    const today = DateTime.now().setZone(this.TIMEZONE);
    return dt.hasSame(today, 'day');
  }

  /**
   * Check if a UTC datetime is in the future (compared to now in Amsterdam).
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @returns true if the datetime is in the future
   */
  isFuture(utcString: string | null | undefined): boolean {
    const dt = this.toAmsterdamTime(utcString);
    if (!dt) return false;

    const now = DateTime.now().setZone(this.TIMEZONE);
    return dt > now;
  }

  /**
   * Check if a UTC datetime is in the past (compared to now in Amsterdam).
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @returns true if the datetime is in the past
   */
  isPast(utcString: string | null | undefined): boolean {
    const dt = this.toAmsterdamTime(utcString);
    if (!dt) return false;

    const now = DateTime.now().setZone(this.TIMEZONE);
    return dt < now;
  }

  /**
   * Check if current time is within X hours before a datetime.
   * Useful for "reservation closes 8 hours before" logic.
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @param hours - Number of hours before the datetime
   * @returns true if current time is past the threshold
   */
  isPastHoursBefore(
    utcString: string | null | undefined,
    hours: number
  ): boolean {
    const dt = this.toAmsterdamTime(utcString);
    if (!dt) return false;

    const threshold = dt.minus({ hours });
    const now = DateTime.now().setZone(this.TIMEZONE);
    return now >= threshold;
  }

  /**
   * Normalize a UTC datetime to YYYY-MM-DD format in Amsterdam timezone.
   * This is the date as it would appear in Amsterdam.
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @returns Date string in YYYY-MM-DD format
   */
  normalizeToDay(utcString: string | null | undefined): string {
    const dt = this.toAmsterdamTime(utcString);
    if (!dt) return '';

    return dt.toFormat('yyyy-MM-dd');
  }

  /**
   * Get the year from a UTC datetime (in Amsterdam timezone).
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @returns Year number
   */
  getYear(utcString: string | null | undefined): number | null {
    const dt = this.toAmsterdamTime(utcString);
    if (!dt) return null;

    return dt.year;
  }

  /**
   * Get the current datetime in Amsterdam timezone as a Luxon DateTime.
   *
   * @returns Current DateTime in Amsterdam timezone
   */
  now(): DateTime {
    return DateTime.now().setZone(this.TIMEZONE);
  }

  /**
   * Get today at midnight in Amsterdam timezone as UTC ISO string.
   * Useful for query filters like "datum_tijd_1 >= today".
   *
   * @returns ISO datetime string (UTC) representing start of today in Amsterdam
   */
  getTodayStartAsUTC(): string {
    const amsterdamMidnight = DateTime.now()
      .setZone(this.TIMEZONE)
      .startOf('day');
    return amsterdamMidnight.toUTC().toISO() ?? '';
  }

  /**
   * Convert a JavaScript Date to Amsterdam timezone DateTime.
   * Useful when working with datepicker values.
   *
   * @param date - JavaScript Date object
   * @returns Luxon DateTime in Amsterdam timezone
   */
  fromJsDate(date: Date | null | undefined): DateTime | null {
    if (!date) return null;

    // JavaScript Date is already in local time, so we need to interpret it correctly
    return DateTime.fromJSDate(date).setZone(this.TIMEZONE);
  }

  /**
   * Format a date for display in Dutch format (e.g., "vrijdag 10 januari 2026").
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @returns Formatted date string with weekday
   */
  formatFullDateWithWeekday(utcString: string | null | undefined): string {
    return this.formatDate(utcString, 'cccc d LLLL yyyy');
  }

  /**
   * Format for "MMM d, yyyy [HH:mm]" pattern used in beheer tables.
   *
   * @param utcString - ISO datetime string from PocketBase (UTC)
   * @returns Formatted string like "jan. 10, 2026 [19:30]"
   */
  formatTableDateTime(utcString: string | null | undefined): string {
    const dt = this.toAmsterdamTime(utcString);
    if (!dt) return '';

    // Use English locale for MMM format to match previous behavior
    const datePart = dt.setLocale('en').toFormat('LLL d, yyyy');
    const timePart = dt.toFormat('HH:mm');
    return `${datePart} [${timePart}]`;
  }
}
