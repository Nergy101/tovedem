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
import Reservering from '../../../../models/domain/resservering.model';

@Component({
  selector: 'app-Reservering-edit-dialog',
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
  templateUrl: './reservering-edit-dialog.component.html',
  styleUrl: './reservering-edit-dialog.component.scss',
})
export class ReserveringEditDialogComponent implements OnInit {
  voornaam?: string;
  achternaam?: string;
  email?: string;
  datum_tijd_1_aantal?: number;
  datum_tijd_2_aantal?: number;
  is_lid_van_tovedem: any;
  is_lid_van_vereniging?: any;
  opmerking?: string;

  reservering?: Reservering;

  loading = signal(false);

  datum1?: Date;
  datum2?: Date;

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


  client = inject(PocketbaseService).client;
  datePipe = inject(DatePipe);
  dialogRef = inject(MatDialogRef<ReserveringEditDialogComponent>);
  existingReserveringData: any = inject(MAT_DIALOG_DATA)
  existingReservering?: Reservering;

  async ngOnInit(): Promise<void> {
    

this.existingReservering = this.existingReserveringData?.existingReservering

console.log(this.existingReserveringData)
console.log(this.existingReservering)


    if(!!this.existingReservering){
      this.voornaam = this.existingReservering.voornaam;
      this.achternaam = this.existingReservering.achternaam;
      this.email = this.existingReservering.email;
      this.datum_tijd_1_aantal = this.existingReservering.datum_tijd_1_aantal;
      this.datum_tijd_2_aantal =  this.existingReservering.datum_tijd_2_aantal;
      this.is_lid_van_tovedem = this.existingReservering.is_vriend_van_tovedem;
      this.is_lid_van_vereniging = this.existingReservering.is_lid_van_vereniging;
      this.opmerking = this.existingReservering.opmerking;
      this.datum1 = new Date(this.existingReservering.datum_tijd_1);
      this.datum2 = !!this.existingReservering.datum_tijd_2 ? new Date(this.existingReservering.datum_tijd_2) : undefined;
    }
  }

  async submit(): Promise<void> {
    this.loading.set(true);

    let reservering = {
      voornaam: this.voornaam,
      achternaam: this.achternaam,
      email: this.email,
      datum_tijd_1_aantal: this.datum_tijd_1_aantal,
      datum_tijd_2_aantal: this.datum_tijd_2_aantal,
      is_lid_van_tovedem: this.is_lid_van_tovedem,
      is_lid_van_vereniging: this.is_lid_van_vereniging,
      opmerking: this.opmerking,
    } as any;

    

    const formData = this.objectToFormData(reservering);


    const created = await this.client
      .collection('reserveringen')
      .create(formData);

    this.dialogRef.close(created);
    this.loading.set(false);
  }



  formIsValid() {
    return (
      !!this.voornaam &&
      this.voornaam != '' &&
      !!this.achternaam &&
      this.achternaam != '' &&
      !!this.email &&
      this.email != '' 
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
