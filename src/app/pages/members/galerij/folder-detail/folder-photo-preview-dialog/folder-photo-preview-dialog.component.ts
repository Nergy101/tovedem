import { Component, HostListener, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VoorstellingFolder } from '../../../../../models/domain/voorstelling-folder.model';
import { PocketbaseService } from '../../../../../shared/services/pocketbase.service';

export interface FolderPhotoPreviewData {
  folder: VoorstellingFolder;
  filename: string;
  fileToken: string | null;
}

@Component({
  selector: 'app-folder-photo-preview-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './folder-photo-preview-dialog.component.html',
  styleUrl: './folder-photo-preview-dialog.component.scss',
})
export class FolderPhotoPreviewDialogComponent {
  dialogRef = inject(MatDialogRef<FolderPhotoPreviewDialogComponent>);
  data: FolderPhotoPreviewData = inject(MAT_DIALOG_DATA);
  client = inject(PocketbaseService);
  loading = true;

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
    if (!this.data.fileToken) return 'assets/Place-Holder-Image.jpg';
    return this.client.directClient.files.getURL(
      this.data.folder,
      this.data.filename,
      {
        token: this.data.fileToken,
      }
    );
  }

  openImageInNewTab(): void {
    window.open(this.getFileUrl(), '_blank');
  }

  onImageLoaded(): void {
    this.loading = false;
  }
}
