import {
  Component,
  EventEmitter,
  OnDestroy,
  Output,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { FilePreviewModel } from 'ngx-awesome-uploader';
import { TovedemFilePickerComponent } from '../tovedem-file-picker/tovedem-file-picker.component';

@Component({
  selector: 'app-image-picker-with-preview',
  imports: [TovedemFilePickerComponent, MatButton, MatIconButton, MatIcon],
  templateUrl: './image-picker-with-preview.component.html',
  styleUrl: './image-picker-with-preview.component.scss',
})
export class ImagePickerWithPreviewComponent implements OnDestroy {
  @Output()
  fileUploaded = new EventEmitter<FilePreviewModel>();
  @Output()
  fileRemoved = new EventEmitter<void>();

  previewUrl = signal<string | null>(null);
  selectedFile: FilePreviewModel | null = null;
  imageKey = signal<number>(0); // Key to force image re-render

  constructor(private cdr: ChangeDetectorRef) {}

  hasFile(): boolean {
    return this.selectedFile !== null && this.selectedFile?.file !== undefined;
  }

  removeFile(): void {
    // Clean up blob URL
    if (this.previewUrl()) {
      URL.revokeObjectURL(this.previewUrl()!);
    }

    // Reset everything
    this.previewUrl.set(null);
    this.selectedFile = null;
    this.imageKey.set(0);
    this.cdr.detectChanges();

    // Emit removal event
    this.fileRemoved.emit();
  }

  onFileUploaded(filePreviewModel: FilePreviewModel): void {
    // Clean up previous blob URL first
    if (this.previewUrl()) {
      URL.revokeObjectURL(this.previewUrl()!);
    }

    // Reset everything to force view update
    this.previewUrl.set(null);
    this.selectedFile = null;
    this.imageKey.set(0); // Reset key first
    this.cdr.detectChanges(); // Force change detection to remove old image

    // Now set new values
    this.selectedFile = filePreviewModel;

    if (filePreviewModel?.file) {
      if (
        filePreviewModel.file instanceof File ||
        filePreviewModel.file instanceof Blob
      ) {
        const newUrl = URL.createObjectURL(filePreviewModel.file);
        this.previewUrl.set(newUrl);
        this.imageKey.update((k) => k + 1); // Increment key to show new image
        this.cdr.detectChanges(); // Force change detection to show new image
      }
    }

    this.fileUploaded.emit(filePreviewModel);
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  ngOnDestroy(): void {
    // Clean up blob URL to prevent memory leaks
    if (this.previewUrl()) {
      URL.revokeObjectURL(this.previewUrl()!);
      this.previewUrl.set(null);
    }
  }
}
