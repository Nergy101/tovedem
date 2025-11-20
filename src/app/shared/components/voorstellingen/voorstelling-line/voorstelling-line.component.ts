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
  ],
})
export class VoorstellingLineComponent {
  voorstelling = input.required<Voorstelling>();
  router = inject(Router);

  getYearFormat(): number {
    return new Date(this.voorstelling().datum_tijd_1).getFullYear();
  }

  getImageUrl(collectionId: string, recordId: string, imageId: string): string {
    return `https://pocketbase.nergy.space/api/files/${collectionId}/${recordId}/${imageId}`;
  }

  hasDatumTijd2(): boolean {
    const datum2 = this.voorstelling().datum_tijd_2;
    if (!datum2 || datum2.trim() === '') {
      return false;
    }
    // Check if it's a valid date
    const date = new Date(datum2);
    return !isNaN(date.getTime());
  }

  inToekomst(): boolean {
    return (
      new Date(this.voorstelling().datum_tijd_1 ?? '') > new Date() ||
      new Date(this.voorstelling().datum_tijd_2 ?? '') > new Date()
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
