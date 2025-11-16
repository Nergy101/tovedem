import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { QuillModule } from 'ngx-quill';
import { Reservering } from '../../../../models/domain/reservering.model';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';

@Component({
  selector: 'app-reservering-edit-dialog',
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
    MatCardModule,
    DatePipe,
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
  is_lid_van_tovedem?: boolean;
  is_lid_van_vereniging?: boolean;
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
  existingReserveringData: {
    reservering: Reservering;
    voorstelling: Voorstelling;
  } = inject(MAT_DIALOG_DATA);
  existingReservering!: Reservering;
  existingVoorstelling!: Voorstelling;

  async ngOnInit(): Promise<void> {
    this.existingReservering = this.existingReserveringData.reservering;
    this.existingVoorstelling = this.existingReserveringData.voorstelling;

    if (this.existingReservering) {
      this.voornaam = this.existingReservering.voornaam;
      this.achternaam = this.existingReservering.achternaam;
      this.email = this.existingReservering.email;
      this.datum_tijd_1_aantal = this.existingReservering.datum_tijd_1_aantal;
      this.datum_tijd_2_aantal = this.existingReservering.datum_tijd_2_aantal;
      this.is_lid_van_tovedem = this.existingReservering.is_vriend_van_tovedem;
      this.is_lid_van_vereniging =
        this.existingReservering.is_lid_van_vereniging;
      this.opmerking = this.existingReservering.opmerking;
      this.datum1 = this.existingVoorstelling?.datum_tijd_1
        ? new Date(this.existingVoorstelling?.datum_tijd_1)
        : undefined;
      this.datum2 = this.existingVoorstelling?.datum_tijd_2
        ? new Date(this.existingVoorstelling?.datum_tijd_2)
        : undefined;
    }
  }

  async submit(): Promise<void> {
    this.loading.set(true);

    const reservering = {
      id: this.existingReservering?.id,
      created: this.existingReservering?.created_at,
      updated: this.existingReservering?.updated_at,
      voornaam: this.voornaam,
      achternaam: this.achternaam,
      email: this.email,
      datum_tijd_1_aantal: this.datum_tijd_1_aantal,
      datum_tijd_2_aantal: this.datum_tijd_2_aantal,
      is_vriend_van_tovedem: this.is_lid_van_tovedem,
      is_lid_van_vereniging: this.is_lid_van_vereniging,
      opmerking: this.opmerking,
      voorstelling: this.existingVoorstelling?.id,
      aanwezig_datum_1: this.existingReservering?.aanwezig_datum_1,
      aanwezig_datum_2: this.existingReservering?.aanwezig_datum_2,
      guid: this.existingReservering?.guid,
      verificatie_status: this.existingReservering?.verificatie_status,
      verificatie_sponsor_id: this.existingReservering?.verificatie_sponsor_id,
    } as Reservering;

    const formData = this.objectToFormData(reservering);

    const upserted = await this.client
      .collection('reserveringen')
      .update(this.existingReservering!.id, formData);

    this.dialogRef.close({ updatedReservering: upserted });
    this.loading.set(false);
  }

  formIsValid(): boolean {
    return (
      !!this.voornaam &&
      this.voornaam != '' &&
      !!this.achternaam &&
      this.achternaam != '' &&
      !!this.email &&
      this.email != ''
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private objectToFormData(obj: Record<string, any>): FormData {
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
