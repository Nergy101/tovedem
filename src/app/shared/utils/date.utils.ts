import { DateTime } from 'luxon';
import { Voorstelling } from '../../models/domain/voorstelling.model';

/**
 * The timezone used for all date operations.
 * All functions in this module use Europe/Amsterdam timezone.
 */
const TIMEZONE = 'Europe/Amsterdam';

/**
 * Normalize a UTC datetime string to YYYY-MM-DD format in Amsterdam timezone.
 * This correctly handles the date as it would appear in Amsterdam.
 *
 * @param date - ISO datetime string (UTC) or Date object
 * @returns Date in YYYY-MM-DD format (Amsterdam timezone)
 */
export function normalizeDateToDay(date: Date | string): string {
  if (!date) return '';

  let dt: DateTime;

  if (typeof date === 'string') {
    // Parse as UTC and convert to Amsterdam
    dt = DateTime.fromISO(date, { zone: 'utc' }).setZone(TIMEZONE);
  } else {
    // JavaScript Date - convert to Amsterdam timezone
    dt = DateTime.fromJSDate(date).setZone(TIMEZONE);
  }

  if (!dt.isValid) return '';

  return dt.toFormat('yyyy-MM-dd');
}

/**
 * Get today's date in YYYY-MM-DD format in Amsterdam timezone.
 *
 * @returns Today's date string
 */
export function getTodayNormalized(): string {
  return DateTime.now().setZone(TIMEZONE).toFormat('yyyy-MM-dd');
}

/**
 * Check if a UTC datetime represents today in Amsterdam timezone.
 *
 * @param date - ISO datetime string (UTC) or Date object
 * @returns true if the date is today in Amsterdam
 */
export function isDateToday(date: Date | string): boolean {
  if (!date) return false;

  const today = getTodayNormalized();
  const dateToCheck = normalizeDateToDay(date);
  return today === dateToCheck;
}

/**
 * Find voorstellingen that have a performance today in Amsterdam timezone.
 * (datum_tijd_1 or datum_tijd_2 matches today)
 *
 * @param voorstellingen - Array of voorstellingen
 * @returns Voorstellingen with a performance today
 */
export function findVoorstellingenForToday(
  voorstellingen: Voorstelling[]
): Voorstelling[] {
  return voorstellingen.filter((voorstelling) => {
    if (voorstelling.datum_tijd_1 && isDateToday(voorstelling.datum_tijd_1)) {
      return true;
    }
    if (voorstelling.datum_tijd_2 && isDateToday(voorstelling.datum_tijd_2)) {
      return true;
    }
    return false;
  });
}

/**
 * Check if a voorstelling has a performance on a specific date (in Amsterdam timezone).
 * Returns 'datum1', 'datum2', or null.
 *
 * @param voorstelling - The voorstelling to check
 * @param date - The date to check against
 * @returns 'datum1', 'datum2', or null
 */
export function getVoorstellingDagForDate(
  voorstelling: Voorstelling,
  date: Date | string
): 'datum1' | 'datum2' | null {
  const normalizedDate = normalizeDateToDay(date);

  if (
    voorstelling.datum_tijd_1 &&
    normalizeDateToDay(voorstelling.datum_tijd_1) === normalizedDate
  ) {
    return 'datum1';
  }

  if (
    voorstelling.datum_tijd_2 &&
    normalizeDateToDay(voorstelling.datum_tijd_2) === normalizedDate
  ) {
    return 'datum2';
  }

  return null;
}

/**
 * Check if a UTC datetime is in the future (compared to now in Amsterdam).
 *
 * @param utcString - ISO datetime string (UTC)
 * @returns true if the datetime is in the future
 */
export function isFutureDate(utcString: string | null | undefined): boolean {
  if (!utcString) return false;

  const dt = DateTime.fromISO(utcString, { zone: 'utc' }).setZone(TIMEZONE);
  if (!dt.isValid) return false;

  const now = DateTime.now().setZone(TIMEZONE);
  return dt > now;
}

/**
 * Check if a UTC datetime is in the past (compared to now in Amsterdam).
 *
 * @param utcString - ISO datetime string (UTC)
 * @returns true if the datetime is in the past
 */
export function isPastDate(utcString: string | null | undefined): boolean {
  if (!utcString) return false;

  const dt = DateTime.fromISO(utcString, { zone: 'utc' }).setZone(TIMEZONE);
  if (!dt.isValid) return false;

  const now = DateTime.now().setZone(TIMEZONE);
  return dt < now;
}

/**
 * Get today at start of day in Amsterdam timezone as UTC ISO string.
 * Useful for PocketBase query filters.
 *
 * @returns ISO datetime string (UTC) representing start of today in Amsterdam
 */
export function getTodayStartAsUTC(): string {
  const amsterdamMidnight = DateTime.now().setZone(TIMEZONE).startOf('day');
  return amsterdamMidnight.toUTC().toISO() ?? '';
}

/**
 * Get the year from a UTC datetime in Amsterdam timezone.
 *
 * @param utcString - ISO datetime string (UTC)
 * @returns Year number
 */
export function getYearFromDate(
  utcString: string | null | undefined
): number | null {
  if (!utcString) return null;

  const dt = DateTime.fromISO(utcString, { zone: 'utc' }).setZone(TIMEZONE);
  if (!dt.isValid) return null;

  return dt.year;
}
