import { Voorstelling } from '../../models/domain/voorstelling.model';

/**
 * Normalize a date to YYYY-MM-DD format (only date, no time)
 */
export function normalizeDateToDay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date matches today (only date part, ignoring time)
 */
export function isDateToday(date: Date | string): boolean {
  const today = normalizeDateToDay(new Date());
  const dateToCheck = normalizeDateToDay(date);
  return today === dateToCheck;
}

/**
 * Find voorstellingen that have a performance today (datum_tijd_1 or datum_tijd_2 matches today)
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
 * Check if a voorstelling has a performance on a specific date
 * Returns 'datum1', 'datum2', or null
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



