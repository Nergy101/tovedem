import { DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MAT_DATE_LOCALE,
  MatOption,
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
import { MatSelect } from '@angular/material/select';
import { DateTime } from 'luxon';
import { FilePreviewModel } from 'ngx-awesome-uploader';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { QuillModule } from 'ngx-quill';
import { Groep } from '../../../../models/domain/groep.model';
import { Speler } from '../../../../models/domain/speler.model';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { TovedemFilePickerComponent } from '../../../../shared/components/tovedem-file-picker/tovedem-file-picker.component';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';

@Component({
  selector: 'app-voorstelling-create-edit-dialog',
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
    MatFormField,
    MatInput,
    MatSelect,
    QuillModule,
    NgxMaterialTimepickerModule,
    MatOption,
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
  selectedSpelers: Speler[] = [];
  selectedGroep?: Groep;
  voorstelling?: Voorstelling;
  publicatie_datum?: Date;
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

  groepen: WritableSignal<Groep[]> = signal([]);
  spelers: WritableSignal<Speler[]> = signal([]);

  client = inject(PocketbaseService).client;
  datePipe = inject(DatePipe);
  dialogRef = inject(MatDialogRef<VoorstellingCreateEditDialogComponent>);
  existingVoorstellingData: { existingVoorstelling: Voorstelling } =
    inject(MAT_DIALOG_DATA);
  existingVoorstelling?: Voorstelling;

  async ngOnInit(): Promise<void> {
    this.spelers.set(await this.client.collection('spelers').getFullList());
    this.groepen.set(await this.client.collection('groepen').getFullList());

    this.existingVoorstelling =
      this.existingVoorstellingData?.existingVoorstelling;

    if (this.existingVoorstelling) {
      this.titel = this.existingVoorstelling.titel;
      this.ondertitel = this.existingVoorstelling.ondertitel;
      this.regie = this.existingVoorstelling.regie;
      this.omschrijving = this.existingVoorstelling.omschrijving;
      this.selectedGroep = this.groepen().find(
        (g) => g.id == this.existingVoorstelling?.expand?.groep?.id
      );
      this.datum1 = new Date(this.existingVoorstelling.datum_tijd_1);
      this.datum2 = this.existingVoorstelling.datum_tijd_2
        ? new Date(this.existingVoorstelling.datum_tijd_2)
        : undefined;
      this.publicatie_datum = new Date(
        this.existingVoorstelling.publicatie_datum
      );
      console.log(this.publicatie_datum);
      //TODO fix

      this.tijd1 = this.formatDateTo12HourString(
        new Date(this.existingVoorstelling.datum_tijd_1)
      );
      this.tijd2 = this.existingVoorstelling.datum_tijd_2
        ? this.formatDateTo12HourString(
            new Date(this.existingVoorstelling.datum_tijd_2)
          )
        : undefined;
    }
  }

  async submit(): Promise<void> {
    this.loading.set(true);

    const voorstelling = {
      titel: this.titel,
      ondertitel: this.ondertitel,
      regie: this.regie,
      omschrijving: this.omschrijving,
      groep: this.selectedGroep?.id,
      //* tijden added below
      datum_tijd_1: undefined,
      datum_tijd_2: undefined,
      //* spelers added through form-data
      //* afbeelding added through form-data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    if (this.tijd1) {
      const tijd1 = this.parseTimeToDate(this.tijd1);

      const date1 = DateTime.fromISO(this.datum1!.toISOString());
      const date1ISO = date1
        .set({ hour: tijd1.getHours(), minute: tijd1.getMinutes() })
        .toISO();

      voorstelling.datum_tijd_1 = date1ISO;
    }

    if (this.tijd2) {
      const tijd2 = this.parseTimeToDate(this.tijd2);
      const date2 = DateTime.fromISO(this.datum2!.toISOString());
      const date2ISO = date2
        .set({ hour: tijd2.getHours(), minute: tijd2.getMinutes() })
        .toISO();

      voorstelling.datum_tijd_2 = date2ISO;
    }

    if (this.publicatie_datum) {
      const publicatie_datum = DateTime.fromISO(
        this.publicatie_datum!.toISOString()
      );
      const PublicatieDateISO = publicatie_datum.toISO();

      voorstelling.publicatie_datum = PublicatieDateISO;
    }

    const formData = this.objectToFormData(voorstelling);

    this.selectedSpelers?.forEach((s) => {
      formData.append('spelers', s.id);
    });

    if (this.afbeelding?.file) {
      formData.append('afbeelding', this.afbeelding?.file);
    }

    if (this.existingVoorstelling) {
      await this.client
        .collection('voorstellingen')
        .update(this.existingVoorstelling.id, formData);
      this.dialogRef.close(this.existingVoorstelling);
      this.loading.set(false);
      return;
    }

    const created = await this.client
      .collection('voorstellingen')
      .create(formData);

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

  parseTimeToDate(time: string): Date {
    // Create a new "blank" Date with today's date but time set to 00:00
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    // Use a regular expression to parse the hours, minutes, and AM/PM
    const timePattern = /^(\d+):(\d+)\s*(AM|PM)$/;
    const match = time.match(timePattern);

    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3];

      // Convert to 24-hour format if needed
      if (period === 'PM' && hours < 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }

      // Set the parsed hours and minutes
      date.setHours(hours, minutes);
    }

    return date;
  }

  formatDateTo12HourString(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    // Pad minutes with leading zero if needed
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();

    return `${hours}:${minutesStr} ${period}`;
  }
}
