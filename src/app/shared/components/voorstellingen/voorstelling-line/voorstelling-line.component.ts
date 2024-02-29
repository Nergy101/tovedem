import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { NavButtonComponent } from '../../nav-button/nav-button.component';

@Component({
  selector: 'app-voorstelling-line',
  standalone: true,
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
  voorstelling = input.required<any>();
  router = inject(Router);

  getYearFormat(): number {
    return new Date(this.voorstelling().datum_tijd_1).getFullYear();
  }

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
