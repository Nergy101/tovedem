import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { NavButtonComponent } from '../../nav-button/nav-button.component';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';

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
