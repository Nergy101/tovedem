import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Afbeelding } from '../../../../models/domain/afbeelding.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';

@Component({
  selector: 'app-image-preview-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButton,
    MatProgressSpinner,
    MatIcon,
  ],
  templateUrl: './image-preview-dialog.component.html',
  styleUrl: './image-preview-dialog.component.scss',
})
export class ImagePreviewDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ImagePreviewDialogComponent>);
  data: { afbeelding: Afbeelding } = inject(MAT_DIALOG_DATA);
  client = inject(PocketbaseService);
  fileToken = signal<string | null>(null);
  loading = signal<boolean>(true);

  async ngOnInit(): Promise<void> {
    this.fileToken.set(await this.client.getFileToken());
  }
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.onLeftArrowDown();
    } else if (event.key === 'ArrowRight') {
      this.onRightArrowDown();
    } else if (event.key === 'Escape') {
      this.onEscapeDown();
    } else if (event.key === 'Enter') {
      this.onEnterDown();
    }
  }

  onEnterDown(): void {
    this.openImageInNewTab();
  }

  onEscapeDown(): void {
    this.dialogRef.close();
  }

  onLeftArrowDown(): void {
    this.dialogRef.close({ action: 'previous' });
  }

  onRightArrowDown(): void {
    this.dialogRef.close({ action: 'next' });
  }

  getFileUrl(): string {
    if (!this.fileToken()) return 'assets/Place-Holder-Image.jpg';
    return this.client.client.files.getURL(
      this.data.afbeelding,
      this.data.afbeelding.bestand,
      {
        token: this.fileToken(),
      }
    );
  }

  openImageInNewTab(): void {
    window.open(this.getFileUrl(), '_blank');
  }
}
