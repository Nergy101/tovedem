import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { NavButtonComponent } from '../../nav-button/nav-button.component';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { MatIconModule } from '@angular/material/icon';
import { AmsterdamDatePipe } from '../../../pipes/amsterdam-date.pipe';
import { isFutureDate } from '../../../utils/date.utils';

@Component({
  selector: 'app-voorstelling-card',
  templateUrl: './voorstelling-card.component.html',
  styleUrl: './voorstelling-card.component.scss',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    NavButtonComponent,
    AmsterdamDatePipe,
  ],
})
export class VoorstellingCardComponent {
  voorstelling = input.required<Voorstelling>();

  router = inject(Router);

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

  inToekomst(): boolean {
    return (
      isFutureDate(this.voorstelling().datum_tijd_1) ||
      isFutureDate(this.voorstelling().datum_tijd_2)
    );
  }
}
