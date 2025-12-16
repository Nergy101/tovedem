import { Component, inject, OnDestroy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { VoorstellingFolder } from '../../../../../models/domain/voorstelling-folder.model';
import { ErrorService } from '../../../../../shared/services/error.service';
import { PocketbaseService } from '../../../../../shared/services/pocketbase.service';

export interface FolderPhotoUploadData {
  folder: VoorstellingFolder;
}

interface SelectedFile {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-folder-photo-upload-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
  ],
  templateUrl: './folder-photo-upload-dialog.component.html',
  styleUrl: './folder-photo-upload-dialog.component.scss',
})
export class FolderPhotoUploadDialogComponent implements OnDestroy {
  dialogRef = inject(MatDialogRef<FolderPhotoUploadDialogComponent>);
  data: FolderPhotoUploadData = inject(MAT_DIALOG_DATA);
  client = inject(PocketbaseService);
  toastr = inject(ToastrService);
  errorService = inject(ErrorService);

  loading = signal(false);
  uploadProgress = signal(0);
  selectedFiles = signal<SelectedFile[]>([]);

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles: SelectedFile[] = [];

      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const previewUrl = URL.createObjectURL(file);
        newFiles.push({ file, previewUrl });
      }

      this.selectedFiles.update((current) => [...current, ...newFiles]);
    }
    // Reset input so the same files can be selected again if needed
    input.value = '';
  }

  removeFile(index: number): void {
    const files = this.selectedFiles();
    if (files[index]) {
      URL.revokeObjectURL(files[index].previewUrl);
    }
    this.selectedFiles.update((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  async submit(): Promise<void> {
    const files = this.selectedFiles();
    if (files.length === 0) {
      this.toastr.error("Selecteer eerst één of meer foto's", 'Fout', {
        positionClass: 'toast-bottom-right',
      });
      return;
    }

    this.loading.set(true);
    this.uploadProgress.set(0);

    try {
      const formData = new FormData();

      // Append all files with the field name 'fotos+'
      // The plus sign tells PocketBase to append to the existing array
      for (const selectedFile of files) {
        formData.append('fotos+', selectedFile.file, selectedFile.file.name);
      }

      // Simulate progress
      this.uploadProgress.set(25);

      await this.client.directClient
        .collection('voorstellingen_folders')
        .update(this.data.folder.id, formData);

      this.uploadProgress.set(100);

      this.toastr.success(
        `${files.length} foto${
          files.length > 1 ? "'s" : ''
        } succesvol toegevoegd`,
        'Gelukt!',
        { positionClass: 'toast-bottom-right' }
      );

      this.dialogRef.close(true);
    } catch (error: unknown) {
      const errorMessage = this.errorService.getErrorMessage(
        error,
        "Foto's uploaden"
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
    // Clean up all object URLs to prevent memory leaks
    for (const file of this.selectedFiles()) {
      URL.revokeObjectURL(file.previewUrl);
    }
  }
}
