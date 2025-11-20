import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
  selector: 'app-confirmatie-dialog',
  imports: [MatDialogModule, CommonModule, MatButton],
  templateUrl: './confirmatie-dialog.component.html',
  styleUrls: ['./confirmatie-dialog.component.scss'],
})
export class ConfirmatieDialogComponent {
  dialogRef = inject(MatDialogRef<ConfirmatieDialogComponent>);
  data: { title: string; message: string; showArchiveButton?: boolean } = inject(MAT_DIALOG_DATA);

  title: string;
  message: string;
  showArchiveButton: boolean;

  constructor() {
    this.title = this.data.title || 'Bevestiging';
    this.message = this.data.message || 'Weet je zeker dat je door wilt gaan?';
    this.showArchiveButton = this.data.showArchiveButton || false;
  }

  archive(): void {
    this.dialogRef.close('archive');
  }
}
