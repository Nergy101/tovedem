import { Component, EventEmitter, Output } from '@angular/core';

import { FilePickerModule, FilePreviewModel } from 'ngx-awesome-uploader';
import { PocketBaseFilePickerAdapter } from './pocketbase-file-picker-adapter';
import {} from '@angular/common/http';

@Component({
  selector: 'app-tovedem-file-picker',
  standalone: true,
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
