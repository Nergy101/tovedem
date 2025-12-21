import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { NavButtonComponent } from '../../nav-button/nav-button.component';
import { AmsterdamDatePipe } from '../../../pipes/amsterdam-date.pipe';
import { DateTimeService } from '../../../services/datetime.service';
import { isFutureDate } from '../../../utils/date.utils';

@Component({
  selector: 'app-voorstelling-line',
  templateUrl: './voorstelling-line.component.html',
  styleUrl: './voorstelling-line.component.scss',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    NavButtonComponent,
    MatTooltipModule,
    AmsterdamDatePipe,
  ],
})
export class VoorstellingLineComponent {
  voorstelling = input.required<Voorstelling>();
  router = inject(Router);
  dateTimeService = inject(DateTimeService);

  getYearFormat(): number {
    return (
      this.dateTimeService.getYear(this.voorstelling().datum_tijd_1) ??
      new Date().getFullYear()
    );
  }

  getImageUrl(
    collectionId: string,
    recordId: string,
    imageId: string
  ): string {
    return `https://pocketbase.nergy.space/api/files/${collectionId}/${recordId}/${imageId}`;
  }

  hasDatumTijd2(): boolean {
    const datum2 = this.voorstelling().datum_tijd_2;
    if (!datum2 || datum2.trim() === '') {
      return false;
    }
    // Check if it's a valid date by attempting to convert to Amsterdam time
    const dt = this.dateTimeService.toAmsterdamTime(datum2);
    return dt !== null;
  }

  inToekomst(): boolean {
    return (
      isFutureDate(this.voorstelling().datum_tijd_1) ||
      isFutureDate(this.voorstelling().datum_tijd_2)
    );
  }

  goToReserveren(): void {
    this.router.navigate(['/reserveren'], {
      queryParams: {
        voorstellingId: this.voorstelling().id,
      },
    });
  }
}
