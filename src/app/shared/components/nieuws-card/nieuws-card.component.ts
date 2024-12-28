import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { NavButtonComponent } from '../nav-button/nav-button.component';
import { Nieuws } from '../../../models/domain/nieuws.model';

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
        NavButtonComponent,
    ]
})
export class NieuwsCardComponent {
  nieuws = input.required<Nieuws>();
  

  router = inject(Router);

  getImageUrl(collectionId: string, recordId: string, imageId: string | undefined): string {
    if (!imageId) {
      return '/assets/Place-Holder-Image.jpg';
    }
    return `https://pocketbase.nergy.space/api/files/${collectionId}/${recordId}/${imageId}?thumb=0x800`;
  }

  publiceren(): boolean {
    return (
      new Date(this.nieuws().publishDate ?? '') > new Date() &&
      !(new Date(this.nieuws().archiveDate ?? '') > new Date())
    );
  }

  archiveren(): boolean {
    return (
      new Date(this.nieuws().archiveDate ?? '') > new Date())
  }
}
