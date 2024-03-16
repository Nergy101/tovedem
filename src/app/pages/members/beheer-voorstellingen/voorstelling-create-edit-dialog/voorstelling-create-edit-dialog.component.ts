import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { QuillModule } from 'ngx-quill';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { DatePipe, Time } from '@angular/common';
import { DateTime } from 'luxon';
import { TovedemFilePickerComponent } from '../../../../shared/components/tovedem-file-picker/tovedem-file-picker.component';
import { FilePreviewModel } from 'ngx-awesome-uploader';

@Component({
  selector: 'app-voorstelling-create-edit-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    QuillModule,
    NgxMaterialTimepickerModule,
    TovedemFilePickerComponent,
  ],
  providers: [provideNativeDateAdapter(), DatePipe],
  templateUrl: './voorstelling-create-edit-dialog.component.html',
  styleUrl: './voorstelling-create-edit-dialog.component.scss',
})
export class VoorstellingCreateEditDialogComponent implements OnInit {
  titel?: string;
  ondertitel?: string;
  regie?: string;
  omschrijving?: string;
  selectedSpelers: any[] = [];
  selectedGroep?: any;

  afbeelding?: FilePreviewModel;

  loading = signal(false);

  datum1?: Date;
  datum2?: Date;
  tijd1?: string;
  tijd2?: string;

  modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // toggled buttons
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }], // custom button values
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
      [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
      [{ direction: 'rtl' }], // text direction
      [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }], // dropdown with defaults from theme
      [{ font: [] }],
      [{ align: [] }],
      ['clean'],
      //['link', 'image','video']
    ],
  };

  groepen: WritableSignal<any[]> = signal([]);
  spelers: WritableSignal<any[]> = signal([]);

  client = inject(PocketbaseService).client;
  datePipe = inject(DatePipe);
  dialogRef = inject(MatDialogRef<VoorstellingCreateEditDialogComponent>);

  async ngOnInit(): Promise<void> {
    this.spelers.set(await this.client.collection('spelers').getFullList());
    this.groepen.set(await this.client.collection('groepen').getFullList());
  }

  async submit(): Promise<void> {
    this.loading.set(true);
    // Parse time-picker string to Luxon.DateTimes
    const tijd1 = DateTime.fromFormat(this.tijd1!, 'h:mm a');
    const tijd2 = DateTime.fromFormat(this.tijd2!, 'h:mm a');

    // Convert JavaScript DateTimes to Luxon.DateTimes
    let date1 = DateTime.fromISO(this.datum1!.toISOString());
    let date2 = DateTime.fromISO(this.datum2!.toISOString());

    // update the time-components on Luxon.DateTimes
    const date1ISO = date1
      .set({ hour: tijd1.hour, minute: tijd1.minute })
      .toISO();

    const date2ISO = date2
      .set({ hour: tijd2.hour, minute: tijd2.minute })
      .toISO();

    const voorstelling = {
      titel: this.titel,
      ondertitel: this.ondertitel,
      regie: this.regie,
      omschrijving: this.omschrijving,
      groep: this.selectedGroep?.id,
      datum_tijd_1: date1ISO,
      datum_tijd_2: date2ISO,
      // spelers added through form-data
      // afbeelding added through form-data
    };

    const formData = this.objectToFormData(voorstelling);

    this.selectedSpelers?.forEach((s) => {
      formData.append('spelers', s.id);
    });

    if (!!this.afbeelding?.file) {
      formData.append('afbeelding', this.afbeelding?.file);
    }

    const created = await this.client
      .collection('voorstellingen')
      .create(formData);

    this.dialogRef.close(created);
    this.loading.set(false);
  }

  onFileUploaded(filePreviewModel: FilePreviewModel) {
    this.afbeelding = filePreviewModel;
  }

  formIsValid() {
    return (
      !!this.titel &&
      this.titel != '' &&
      !!this.ondertitel &&
      this.ondertitel != '' &&
      !!this.regie &&
      this.regie != '' &&
      this.regie != '<p></p>' &&
      !!this.omschrijving &&
      this.omschrijving != '' &&
      this.omschrijving != '<p></p>' &&
      !!this.selectedGroep &&
      this.selectedSpelers?.length > 0
    );
  }

  private objectToFormData(obj: { [key: string]: any }): FormData {
    const formData = new FormData();
    Object.entries(obj).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // If the value is an array, append each item individually
        value.forEach((item) => formData.append(key + '[]', item));
      } else if (typeof value === 'object' && value instanceof File) {
        // If the value is a File object, append it directly
        formData.append(key, value, value.name);
      } else {
        // For other types, append the value directly
        formData.append(key, value);
      }
    });
    return formData;
  }
}
