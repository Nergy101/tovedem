
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bericht-view-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './bericht-view-dialog.component.html',
  styleUrls: ['./bericht-view-dialog.component.scss'],
})
export class BerichtViewDialogComponent {
  dialogRef = inject(MatDialogRef<BerichtViewDialogComponent>);
  data: {
    bericht: string;
    naam: string;
    voornaam?: string;
    achternaam?: string;
    geboortedatum?: string;
    groep?: string;
  } = inject(MAT_DIALOG_DATA);

  bericht: string;
  naam: string;
  voornaam?: string;
  achternaam?: string;
  geboortedatum?: string;
  groep?: string;

  constructor() {
    this.bericht = this.data.bericht || '';
    this.naam = this.data.naam || '';
    this.voornaam = this.data.voornaam;
    this.achternaam = this.data.achternaam;
    this.geboortedatum = this.data.geboortedatum;
    this.groep = this.data.groep;
  }

  close(): void {
    this.dialogRef.close();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

