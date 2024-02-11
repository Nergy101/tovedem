import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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

  getImageUrl(collectionId: string, recordId: string, imageId: string): string {
    return `https://tovedem.pockethost.io/api/files/${collectionId}/${recordId}/${imageId}`;
  }
}
