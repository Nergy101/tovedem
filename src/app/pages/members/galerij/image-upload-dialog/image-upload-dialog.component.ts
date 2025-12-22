
import { Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ToastrService } from 'ngx-toastr';
import { FilePreviewModel } from 'ngx-awesome-uploader';
import { ErrorService } from '../../../../shared/services/error.service';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { ImagePickerWithPreviewComponent } from '../../../../shared/components/image-picker-with-preview/image-picker-with-preview.component';

@Component({
  selector: 'app-image-upload-dialog',
  imports: [
    MatDialogModule,
    MatButton,
    MatIcon,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    ImagePickerWithPreviewComponent,
  ],
  templateUrl: './image-upload-dialog.component.html',
  styleUrl: './image-upload-dialog.component.scss',
})
export class ImageUploadDialogComponent {
  dialogRef = inject(MatDialogRef<ImageUploadDialogComponent>);
  client = inject(PocketbaseService);
  toastr = inject(ToastrService);
  errorService = inject(ErrorService);

  loading = signal(false);
  uploadProgress = signal(0);
  selectedFile?: File;

  onFileUploaded(filePreviewModel: FilePreviewModel): void {
    if (filePreviewModel?.file instanceof File) {
      this.selectedFile = filePreviewModel.file;
    }
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

}
