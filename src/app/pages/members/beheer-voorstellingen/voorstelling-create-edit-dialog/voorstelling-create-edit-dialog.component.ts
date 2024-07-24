import {
  Component,
  ImportProvidersSource,
  Inject,
  OnInit,
  Provider,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { QuillModule } from 'ngx-quill';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { DatePipe } from '@angular/common';
import { DateTime } from 'luxon';
import { TovedemFilePickerComponent } from '../../../../shared/components/tovedem-file-picker/tovedem-file-picker.component';
import { FilePreviewModel } from 'ngx-awesome-uploader';
import Voorstelling from '../../../../models/domain/voorstelling.model';

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
  providers: [
    provideNativeDateAdapter(),
    DatePipe,
    { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
  ],
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
  voorstelling?: Voorstelling;

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
  existingVoorstellingData: any = inject(MAT_DIALOG_DATA)
  existingVoorstelling?: Voorstelling;

  async ngOnInit(): Promise<void> {
    this.spelers.set(await this.client.collection('spelers').getFullList());
    this.groepen.set(await this.client.collection('groepen').getFullList());
    

this.existingVoorstelling = this.existingVoorstellingData?.existingVoorstelling

console.log(this.existingVoorstellingData)
console.log(this.existingVoorstelling)


    if(!!this.existingVoorstelling){
      this.titel = this.existingVoorstelling.titel;
      this.ondertitel = this.existingVoorstelling.ondertitel;
      this.regie = this.existingVoorstelling.regie;
      this.omschrijving =  this.existingVoorstelling.omschrijving;
      this.selectedGroep = this.groepen().find(g => g.id == this.existingVoorstelling?.expand?.groep?.id);
      this.datum1 = new Date(this.existingVoorstelling.datum_tijd_1);
      this.datum2 = !!this.existingVoorstelling.datum_tijd_2 ? new Date(this.existingVoorstelling.datum_tijd_2) : undefined;
      //TODO fix
      this.tijd1 = DateTime.fromFormat(this.existingVoorstelling.datum_tijd_1, "h:mm a").toString()
      // this.tijd2 = !!this.existingVoorstelling.datum_tijd_2 ? new Date(this.existingVoorstelling.datum_tijd_2).getTime().toLocaleString() : undefined ;
    }
  }

  async submit(): Promise<void> {
    this.loading.set(true);

    let voorstelling = {
      titel: this.titel,
      ondertitel: this.ondertitel,
      regie: this.regie,
      omschrijving: this.omschrijving,
      groep: this.selectedGroep?.id,
      datum_tijd_1: null,
      datum_tijd_2: null,
      // spelers added through form-data
      // afbeelding added through form-data
    } as any;

    if (this.tijd1) {
      const tijd1 = DateTime.fromFormat(this.tijd1!, 'h:mm a');
      let date1 = DateTime.fromISO(this.datum1!.toISOString());
      const date1ISO = date1
        .set({ hour: tijd1.hour, minute: tijd1.minute })
        .toISO();

      voorstelling.datum_tijd_1 = date1ISO;
    }

    if (this.tijd2) {
      const tijd2 = DateTime.fromFormat(this.tijd2!, 'h:mm a');
      let date2 = DateTime.fromISO(this.datum2!.toISOString());
      const date2ISO = date2
        .set({ hour: tijd2.hour, minute: tijd2.minute })
        .toISO();

      voorstelling.datum_tijd_2 = date2ISO;
    }

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
      !!this.selectedGroep
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
