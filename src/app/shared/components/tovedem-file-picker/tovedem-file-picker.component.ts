import { Component, EventEmitter, Output } from '@angular/core';
import { FilePickerModule, FilePreviewModel } from 'ngx-awesome-uploader';
import { PocketBaseFilePickerAdapter } from './pocketbase-file-picker-adapter';

@Component({
  selector: 'app-tovedem-file-picker',
  imports: [FilePickerModule],
  templateUrl: './tovedem-file-picker.component.html',
  styleUrl: './tovedem-file-picker.component.scss',
})
export class TovedemFilePickerComponent {
  @Output()
  onFileUploaded = new EventEmitter<FilePreviewModel>();

  adapter = new PocketBaseFilePickerAdapter();

  internalOnFileUploaded(filePreview: FilePreviewModel) {
    this.onFileUploaded.emit(filePreview);
  }
}
