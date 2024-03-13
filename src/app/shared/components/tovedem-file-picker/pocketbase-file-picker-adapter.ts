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
    const formData = new FormData();
    formData.append('afbeelding', fileItem.file);

    console.log(formData);

    var createdImage = this.client.collection('afbeeldingen').create(formData);

    return from(createdImage).pipe(
      map((res) => {
        return {
          status: UploadStatus.UPLOADED,
          body: res,
          progress: 100,
        };
      }),
      catchError((er) => {
        console.log(er);
        return of({ status: UploadStatus.ERROR, body: er });
      })
    );
  }

  public removeFile(fileItem: FilePreviewModel): Observable<any> {
    const id = 50;
    const responseFromBackend = fileItem.uploadResponse;
    console.log(fileItem);
    const removeApi =
      'https://run.mocky.io/v3/dedf88ec-7ce8-429a-829b-bd2fc55352bc';
    return this.http.post(removeApi, { id });
  }

  // public uploadFile(fileItem: FilePreviewModel): Observable<UploadResponse> {
  //   const form = new FormData();
  //   form.append('file', fileItem.file);
  //   const api = 'https://ngx-awesome-uploader.free.beeceptor.com/upload';
  //   const req = new HttpRequest('POST', api, form, { reportProgress: true });

  //   return of({
  //     status: UploadStatus.IN_PROGRESS,
  //     progress: 0,
  //   });
  // }

  // public removeFile(fileItem: FilePreviewModel): Observable<any> {
  //   console.log(fileItem);

  //   return of(null);
  // }
}
