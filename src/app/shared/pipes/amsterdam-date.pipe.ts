import { Pipe, PipeTransform, inject } from '@angular/core';
import { DateTimeService } from '../services/datetime.service';

/**
 * A pipe that formats UTC datetime strings in Europe/Amsterdam timezone.
 * This correctly handles DST for the target date, not the current date.
 *
 * Usage examples:
 *   {{ utcString | amsterdamDate:'HH:mm' }}           // "19:30"
 *   {{ utcString | amsterdamDate:'d LLLL' }}          // "10 januari"
 *   {{ utcString | amsterdamDate:'dd LLLL yyyy' }}    // "10 januari 2026"
 *   {{ utcString | amsterdamDate:'d' }}               // "10"
 *   {{ utcString | amsterdamDate:'LLLL' }}            // "januari"
 *   {{ utcString | amsterdamDate:'yyyy' }}            // "2026"
 *   {{ utcString | amsterdamDate:'table' }}           // "jan. 10, 2026 [19:30]"
 *   {{ utcString | amsterdamDate }}                   // "10 januari 2026" (default)
 *
 * For Luxon format tokens, see: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
 */
@Pipe({
  name: 'amsterdamDate',
  standalone: true,
})
export class AmsterdamDatePipe implements PipeTransform {
  private dateTimeService = inject(DateTimeService);

  transform(
    value: string | null | undefined,
    format?: string,
    locale = 'nl'
  ): string {
    if (!value) return '';

    // Handle special format shortcuts
    switch (format) {
      case 'time':
        return this.dateTimeService.formatTime(value);
      case 'day':
        return this.dateTimeService.formatDay(value);
      case 'month':
        return this.dateTimeService.formatMonth(value);
      case 'year':
        return this.dateTimeService.formatYear(value);
      case 'dayMonth':
        return this.dateTimeService.formatDayMonth(value);
      case 'full':
        return this.dateTimeService.formatFullDate(value);
      case 'fullWithWeekday':
        return this.dateTimeService.formatFullDateWithWeekday(value);
      case 'table':
        return this.dateTimeService.formatTableDateTime(value);
      default:
        // Use custom Luxon format string or default to full date
        return this.dateTimeService.formatDate(
          value,
          format || 'dd LLLL yyyy',
          locale
        );
    }
  }
}
