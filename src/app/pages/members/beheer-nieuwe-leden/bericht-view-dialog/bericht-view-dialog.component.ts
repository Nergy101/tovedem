import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bericht-view-dialog',
  imports: [MatDialogModule, CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './bericht-view-dialog.component.html',
  styleUrls: ['./bericht-view-dialog.component.scss'],
})
export class BerichtViewDialogComponent {
  dialogRef = inject(MatDialogRef<BerichtViewDialogComponent>);
  data: { bericht: string; naam: string } = inject(MAT_DIALOG_DATA);

  bericht: string;
  naam: string;

  constructor() {
    this.bericht = this.data.bericht || '';
    this.naam = this.data.naam || '';
  }

  close(): void {
    this.dialogRef.close();
  }
}

