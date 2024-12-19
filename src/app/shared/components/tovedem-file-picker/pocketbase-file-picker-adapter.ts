/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  FilePickerAdapter,
  FilePreviewModel,
  UploadResponse,
  UploadStatus,
} from 'ngx-awesome-uploader';
import { Observable, of } from 'rxjs';
import { PocketbaseService } from '../../services/pocketbase.service';

//? https://github.com/vugar005/ngx-awesome-uploader/blob/master/projects/file-picker/src/lib/mock-file-picker.adapter.ts
export class PocketBaseFilePickerAdapter extends FilePickerAdapter {
  http = inject(HttpClient);
  client = inject(PocketbaseService).client;

  constructor() {
    super();
  }

  public uploadFile(fileItem: FilePreviewModel): Observable<UploadResponse> {
    return of({
      body: fileItem,
      status: UploadStatus.UPLOADED, // not really, but good enough
      progress: 100,
    });
  }

  public removeFile(_: FilePreviewModel): Observable<any> {
    // @TODO Check implementation?
    return of(null);
  }
}
