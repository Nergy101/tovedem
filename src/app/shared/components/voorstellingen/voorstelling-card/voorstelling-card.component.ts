import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { NavButtonComponent } from '../../nav-button/nav-button.component';

@Component({
  selector: 'app-voorstelling-card',
  standalone: true,
  templateUrl: './voorstelling-card.component.html',
  styleUrl: './voorstelling-card.component.scss',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    NavButtonComponent,
  ],
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
}
