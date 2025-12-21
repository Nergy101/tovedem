import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Nieuws } from '../../../models/domain/nieuws.model';
import { AmsterdamDatePipe } from '../../pipes/amsterdam-date.pipe';
import { DateTimeService } from '../../services/datetime.service';

@Component({
  selector: 'app-nieuws-card',
  templateUrl: './nieuws-card.component.html',
  styleUrl: './nieuws-card.component.scss',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    AmsterdamDatePipe,
  ],
})
export class NieuwsCardComponent {
  nieuws = input.required<Nieuws>();

  router = inject(Router);
  dateTimeService = inject(DateTimeService);

  getImageUrl(
    collectionId: string,
    recordId: string,
    imageId: string | undefined
  ): string {
    if (!imageId) {
      return '/assets/Place-Holder-Image.jpg';
    }
    return `https://pocketbase.nergy.space/api/files/${collectionId}/${recordId}/${imageId}?thumb=0x800`;
  }

  publiceren(): boolean {
    return (
      this.dateTimeService.isFuture(this.nieuws().publishDate) &&
      !this.dateTimeService.isFuture(this.nieuws().archiveDate)
    );
  }

  archiveren(): boolean {
    return this.dateTimeService.isFuture(this.nieuws().archiveDate);
  }
}
