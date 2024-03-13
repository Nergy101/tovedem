import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Observable, from, of } from 'rxjs';
import {
  FilePickerAdapter,
  UploadResponse,
  UploadStatus,
  FilePreviewModel,
} from 'ngx-awesome-uploader';
import { inject } from '@angular/core';
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

  public removeFile(fileItem: FilePreviewModel): Observable<any> {
    // @TODO Check implementation?
    return of(null);
  }
}
