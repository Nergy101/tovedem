import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-informatie-dialog',
  imports: [MatDialogModule, CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './informatie-dialog.component.html',
  styleUrls: ['./informatie-dialog.component.scss'],
})
export class InformatieDialogComponent {
  dialogRef = inject(MatDialogRef<InformatieDialogComponent>);
  sanitizer = inject(DomSanitizer);
  data: { title: string; content: string } = inject(MAT_DIALOG_DATA);

  title: string;
  safeContent: SafeHtml;

  constructor() {
    this.title = this.data.title || 'Informatie';
    this.safeContent = this.sanitizer.bypassSecurityTrustHtml(
      this.data.content || ''
    );
  }

  close(): void {
    this.dialogRef.close();
  }
}

