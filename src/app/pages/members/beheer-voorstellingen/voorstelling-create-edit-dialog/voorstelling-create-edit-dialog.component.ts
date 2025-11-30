import { DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
  computed,
} from '@angular/core';
import {
  Field,
  form,
  required,
  min,
  maxLength,
  debounce,
} from '@angular/forms/signals';
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
import { QuillModule } from 'ngx-quill';
import { Groep } from '../../../../models/domain/groep.model';
import { Speler } from '../../../../models/domain/speler.model';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { VoorstellingFormModel } from '../../../../models/form-models/voorstelling-form.model';
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
    Field,
    FormsModule,
    MatFormField,
    MatDatepicker,
    MatFormField,
    MatInput,
    MatSelect,
    QuillModule,
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
  // Signal Forms: Create form model and form instance
  // NOTE: Signal Forms are experimental in Angular 21
  // Quill editor and file upload are handled manually (not via Signal Forms)
  voorstellingModel = signal<VoorstellingFormModel>({
    titel: '',
    ondertitel: null,
    regie: '',
    omschrijving: '',
    selectedGroep: null,
    datum1: null,
    datum2: null,
    tijd1: '',
    tijd2: '',
    beschikbare_stoelen_datum_tijd_1: 100,
    beschikbare_stoelen_datum_tijd_2: 100,
    prijs_per_kaartje: 0,
    publicatie_datum: null,
    selectedSpelers: [],
    afbeelding: null,
  });

  voorstellingForm = form(this.voorstellingModel, (schemaPath) => {
    debounce(schemaPath.titel, 500);
    debounce(schemaPath.ondertitel, 500);
    debounce(schemaPath.regie, 500);
    debounce(schemaPath.omschrijving, 500);
    debounce(schemaPath.tijd1, 500);
    debounce(schemaPath.tijd2, 500);
    required(schemaPath.titel, {
      message: 'Titel is verplicht',
    });
    maxLength(schemaPath.titel, 30, {
      message: 'Titel mag maximaal 30 tekens lang zijn',
    });
    // ondertitel is optional in PocketBase, so no required() validator
    required(schemaPath.regie, {
      message: 'Regie is verplicht',
    });
    required(schemaPath.omschrijving, {
      message: 'Omschrijving is verplicht',
    });
    required(schemaPath.selectedGroep, {
      message: 'Groep is verplicht',
    });
    required(schemaPath.prijs_per_kaartje, {
      message: 'Prijs per kaartje is verplicht',
    });
    min(schemaPath.prijs_per_kaartje, 0, {
      message: 'Prijs per kaartje moet minimaal 0 zijn',
    });
    required(schemaPath.datum1, {
      message: 'Datum 1 is verplicht',
    });
    required(schemaPath.tijd1, {
      message: 'Tijd 1 is verplicht',
    });
  });

  loading = signal(false);

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
      // Populate form model with existing data
      this.voorstellingModel.set({
        titel: this.existingVoorstelling.titel,
        ondertitel: this.existingVoorstelling.ondertitel || null, // Optional in PocketBase
        regie: this.existingVoorstelling.regie, // Required in PocketBase
        omschrijving: this.existingVoorstelling.omschrijving, // Required in PocketBase
        selectedGroep:
          this.groepen().find(
            (g) => g.id == this.existingVoorstelling?.expand?.groep?.id
          ) || null,
        datum1: new Date(this.existingVoorstelling.datum_tijd_1),
        datum2: this.existingVoorstelling.datum_tijd_2
          ? new Date(this.existingVoorstelling.datum_tijd_2)
          : null,
        tijd1: this.formatDateTo24HourString(
          new Date(this.existingVoorstelling.datum_tijd_1)
        ),
        tijd2: this.existingVoorstelling.datum_tijd_2
          ? this.formatDateTo24HourString(
              new Date(this.existingVoorstelling.datum_tijd_2)
            )
          : '',
        beschikbare_stoelen_datum_tijd_1:
          this.existingVoorstelling.beschikbare_stoelen_datum_tijd_1,
        beschikbare_stoelen_datum_tijd_2:
          this.existingVoorstelling.beschikbare_stoelen_datum_tijd_2,
        prijs_per_kaartje: this.existingVoorstelling.prijs_per_kaartje,
        publicatie_datum: new Date(this.existingVoorstelling.publicatie_datum),
        selectedSpelers: [],
        afbeelding: null,
      });
    }
  }

  updateRegie(value: string): void {
    this.voorstellingModel.update((model) => ({ ...model, regie: value }));
  }

  updateOmschrijving(value: string): void {
    this.voorstellingModel.update((model) => ({
      ...model,
      omschrijving: value,
    }));
  }

  updateOndertitel(value: string): void {
    this.voorstellingModel.update((model) => ({
      ...model,
      ondertitel: value || null,
    }));
  }

  ondertitelValue = computed(
    () => this.voorstellingForm.ondertitel().value() || ''
  );

  async submit(): Promise<void> {
    if (!this.voorstellingForm().valid()) {
      return;
    }

    this.loading.set(true);

    const formData = this.voorstellingModel();
    const voorstelling = {
      titel: formData.titel,
      ondertitel: formData.ondertitel,
      regie: formData.regie,
      omschrijving: formData.omschrijving,
      groep: formData.selectedGroep?.id,
      beschikbare_stoelen_datum_tijd_1:
        formData.beschikbare_stoelen_datum_tijd_1,
      beschikbare_stoelen_datum_tijd_2:
        formData.beschikbare_stoelen_datum_tijd_2,
      publicatie_datum: formData.publicatie_datum,
      prijs_per_kaartje: formData.prijs_per_kaartje,
      //* tijden added below
      datum_tijd_1: undefined,
      datum_tijd_2: undefined,
      //* spelers added through form-data
      //* afbeelding added through form-data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    if (formData.tijd1 && formData.datum1) {
      const tijd1 = this.parseTimeToDate(formData.tijd1);
      const date1 = DateTime.fromISO(formData.datum1.toISOString());
      const date1ISO = date1
        .set({ hour: tijd1.getHours(), minute: tijd1.getMinutes() })
        .toISO();
      voorstelling.datum_tijd_1 = date1ISO;
    }

    if (formData.tijd2 && formData.datum2) {
      const tijd2 = this.parseTimeToDate(formData.tijd2);
      const date2 = DateTime.fromISO(formData.datum2.toISOString());
      const date2ISO = date2
        .set({ hour: tijd2.getHours(), minute: tijd2.getMinutes() })
        .toISO();
      voorstelling.datum_tijd_2 = date2ISO;
    }

    if (formData.publicatie_datum) {
      const publicatie_datum = DateTime.fromISO(
        formData.publicatie_datum.toISOString()
      );
      const PublicatieDateISO = publicatie_datum.toISO();
      voorstelling.publicatie_datum = PublicatieDateISO;
    }

    const formDataObj = this.objectToFormData(voorstelling);

    formData.selectedSpelers?.forEach((s) => {
      formDataObj.append('spelers', s.id);
    });

    if (formData.afbeelding?.file) {
      formDataObj.append('afbeelding', formData.afbeelding.file);
    }

    if (this.existingVoorstelling) {
      await this.client
        .collection('voorstellingen')
        .update(this.existingVoorstelling.id, formDataObj);
      this.dialogRef.close(this.existingVoorstelling);
      this.loading.set(false);
      return;
    }

    const created = await this.client
      .collection('voorstellingen')
      .create(formDataObj);

    this.dialogRef.close(created);
    this.loading.set(false);
  }

  onFileUploaded(filePreviewModel: FilePreviewModel): void {
    this.voorstellingModel.update((model) => ({
      ...model,
      afbeelding: filePreviewModel,
    }));
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

    // Parse HH:MM format (24-hour format from HTML time input)
    const timePattern = /^(\d{2}):(\d{2})$/;
    const match = time.match(timePattern);

    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);

      // Set the parsed hours and minutes
      date.setHours(hours, minutes);
    }

    return date;
  }

  formatDateTo24HourString(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Pad hours and minutes with leading zero if needed
    const hoursStr = hours < 10 ? `0${hours}` : hours.toString();
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();

    return `${hoursStr}:${minutesStr}`;
  }
}
