import { DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import {
  MatDatepicker,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { DateTime } from 'luxon';
import { FilePreviewModel } from 'ngx-awesome-uploader';
import { QuillModule } from 'ngx-quill';
import { Nieuws } from '../../../../models/domain/nieuws.model';
import { TovedemFilePickerComponent } from '../../../../shared/components/tovedem-file-picker/tovedem-file-picker.component';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';

@Component({
  selector: 'app-nieuws-create-edit-dialog',
  imports: [
    MatDatepickerModule,
    MatButton,
    MatIconButton,
    MatIcon,
    MatDialogModule,
    MatInputModule,
    FormsModule,
    MatFormField,
    MatDatepicker,
    MatInput,
    QuillModule,
    TovedemFilePickerComponent,
  ],
  providers: [
    provideNativeDateAdapter(),
    DatePipe,
    { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
  ],
  templateUrl: './nieuws-create-edit-dialog.component.html',
  styleUrl: './nieuws-create-edit-dialog.component.scss',
})
export class NieuwsCreateEditDialogComponent implements OnInit {
  titel?: string;
  inhoud?: string;
  publishDate?: Date;
  archiveDate?: Date;
  afbeelding?: FilePreviewModel;

  loading = signal(false);

  modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      ['clean'],
    ],
  };

  client = inject(PocketbaseService).client;
  datePipe = inject(DatePipe);
  dialogRef = inject(MatDialogRef<NieuwsCreateEditDialogComponent>);
  existingNieuwsData: { existingNieuws: Nieuws | null } =
    inject(MAT_DIALOG_DATA);
  existingNieuws?: Nieuws;

  async ngOnInit(): Promise<void> {
    this.existingNieuws = this.existingNieuwsData?.existingNieuws || undefined;

    if (this.existingNieuws) {
      this.titel = this.existingNieuws.titel;
      this.inhoud = this.existingNieuws.inhoud;
      this.publishDate = this.existingNieuws.publishDate
        ? new Date(this.existingNieuws.publishDate)
        : undefined;
      this.archiveDate = this.existingNieuws.archiveDate
        ? new Date(this.existingNieuws.archiveDate)
        : undefined;
    }
  }

  async submit(): Promise<void> {
    this.loading.set(true);

    const nieuws = {
      titel: this.titel,
      inhoud: this.inhoud,
      publishDate: undefined,
      archiveDate: undefined,
    } as any;

    if (this.publishDate) {
      const publishDate = DateTime.fromISO(this.publishDate.toISOString());
      nieuws.publishDate = publishDate.toISO();
    }

    if (this.archiveDate) {
      const archiveDate = DateTime.fromISO(this.archiveDate.toISOString());
      nieuws.archiveDate = archiveDate.toISO();
    }

    const formData = this.objectToFormData(nieuws);

    if (this.afbeelding?.file) {
      formData.append('afbeelding', this.afbeelding.file);
    }

    if (this.existingNieuws) {
      await this.client
        .collection('nieuws')
        .update(this.existingNieuws.id, formData);
      this.dialogRef.close(this.existingNieuws);
      this.loading.set(false);
      return;
    }

    const created = await this.client.collection('nieuws').create(formData);

    this.dialogRef.close(created);
    this.loading.set(false);
  }

  onFileUploaded(filePreviewModel: FilePreviewModel): void {
    this.afbeelding = filePreviewModel;
  }

  formIsValid(): boolean {
    return (
      !!this.titel &&
      this.titel != '' &&
      !!this.inhoud &&
      this.inhoud != '' &&
      this.inhoud != '<p></p>'
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private objectToFormData(obj: Record<string, any>): FormData {
    const formData = new FormData();
    Object.entries(obj).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key + '[]', item));
      } else if (typeof value === 'object' && value instanceof File) {
        formData.append(key, value, value.name);
      } else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    return formData;
  }
}


