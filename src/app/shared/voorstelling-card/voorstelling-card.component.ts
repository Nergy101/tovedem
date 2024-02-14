import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-voorstelling-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './voorstelling-card.component.html',
  styleUrl: './voorstelling-card.component.scss',
})
export class VoorstellingCardComponent {
  voorstelling = input.required<any>();

  router = inject(Router);

  getImageUrl(collectionId: string, recordId: string, imageId: string): string {
    return `https://tovedem.pockethost.io/api/files/${collectionId}/${recordId}/${imageId}`;
  }

  inToekomst(): boolean {
    return (
      new Date(this.voorstelling().datum_tijd_1) > new Date() ||
      new Date(this.voorstelling().datum_tijd_2) > new Date()
    );
  }

  goToReserveren(): void {
    this.router.navigate(['/Reserveren'], {
      queryParams: {
        voorstelling: this.voorstelling().id,
      },
    });
  }
}
