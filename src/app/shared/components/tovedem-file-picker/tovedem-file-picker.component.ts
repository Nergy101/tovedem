import { Component, EventEmitter, Output } from '@angular/core';

import { FilePickerModule, FilePreviewModel } from 'ngx-awesome-uploader';
import { PocketBaseFilePickerAdapter } from './pocketbase-file-picker-adapter';
import {} from '@angular/common/http';

@Component({
  selector: 'app-tovedem-file-picker',
  standalone: true,
  imports: [FilePickerModule, 
// TODO: `HttpClientModule` should not be imported into a component directly.
// Please refactor the code to add `provideHttpClient()` call to the provider list in the
// application bootstrap logic and remove the `HttpClientModule` import from this component.
HttpClientModule],
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
