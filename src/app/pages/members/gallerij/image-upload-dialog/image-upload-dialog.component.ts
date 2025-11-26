import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ToastrService } from 'ngx-toastr';
import { ErrorService } from '../../../../shared/services/error.service';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';

@Component({
  selector: 'app-image-upload-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButton,
    MatIcon,
    MatProgressSpinnerModule,
    MatProgressBarModule,
  ],
  templateUrl: './image-upload-dialog.component.html',
  styleUrl: './image-upload-dialog.component.scss',
})
export class ImageUploadDialogComponent implements OnDestroy {
  dialogRef = inject(MatDialogRef<ImageUploadDialogComponent>);
  client = inject(PocketbaseService);
  toastr = inject(ToastrService);
  errorService = inject(ErrorService);

  loading = signal(false);
  uploadProgress = signal(0);
  selectedFile?: File;
  previewUrl = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
      
      // Create object URL for preview
      if (this.previewUrl()) {
        URL.revokeObjectURL(this.previewUrl()!);
      }
      const url = URL.createObjectURL(file);
      this.previewUrl.set(url);
    }
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  async submit(): Promise<void> {
    if (!this.selectedFile) {
      this.toastr.error('Selecteer eerst een afbeelding', 'Fout', {
        positionClass: 'toast-bottom-right',
      });
      return;
    }

    this.loading.set(true);
    this.uploadProgress.set(0);

    try {
      const formData = new FormData();
      formData.append('bestand', this.selectedFile, this.selectedFile.name);

      // Simulate progress for better UX
      this.uploadProgress.set(25);

      await this.client.directClient
        .collection('afbeeldingen')
        .create(formData);

      this.uploadProgress.set(100);

      this.toastr.success('Afbeelding succesvol toegevoegd', 'Gelukt!', {
        positionClass: 'toast-bottom-right',
      });

      this.dialogRef.close(true);
    } catch (error: unknown) {
      const errorMessage = this.errorService.getErrorMessage(
        error,
        'Afbeelding uploaden'
      );
      this.toastr.error(errorMessage, 'Fout bij uploaden', {
        positionClass: 'toast-bottom-right',
        timeOut: 7000,
      });
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    // Clean up object URL to prevent memory leaks
    if (this.previewUrl()) {
      URL.revokeObjectURL(this.previewUrl()!);
    }
  }
}
