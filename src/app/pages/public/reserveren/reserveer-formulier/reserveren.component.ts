import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  Field,
  form,
  required,
  email,
  min,
  max,
  maxLength,
  debounce,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Groep } from '../../../../models/domain/groep.model';
import { Reservering } from '../../../../models/domain/reservering.model';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { ReserveringFormModel } from '../../../../models/form-models/reservering-form.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { SeoService } from '../../../../shared/services/seo.service';
import { ErrorService } from '../../../../shared/services/error.service';

@Component({
  selector: 'app-reserveren',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    Field,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
  ],
  templateUrl: './reserveren.component.html',
  styleUrl: './reserveren.component.scss',
})
export class ReserverenComponent implements OnInit {
  client = inject(PocketbaseService);
  snackBar = inject(MatSnackBar);
  seoService = inject(SeoService);
  errorService = inject(ErrorService);

  router = inject(Router);

  // Signal Forms: Create form model and form instance
  // NOTE: Signal Forms are experimental in Angular 21
  reserveringModel = signal<ReserveringFormModel>({
    name: '',
    surname: '',
    email: '',
    email2: '',
    vriendVanTovedem: false,
    lidVanTovedemMejotos: false,
    opmerking: '',
    amountOfPeopleDate1: 0,
    amountOfPeopleDate2: 0,
  });

  reserveringForm = form(this.reserveringModel, (schemaPath) => {
    debounce(schemaPath.name, 500);
    debounce(schemaPath.surname, 500);
    debounce(schemaPath.email, 500);
    debounce(schemaPath.email2, 500);
    debounce(schemaPath.opmerking, 500);
    maxLength(schemaPath.opmerking, 250, {
      message: 'Opmerking mag maximaal 250 tekens lang zijn',
    });
    required(schemaPath.name, { message: 'Voornaam is verplicht' });
    required(schemaPath.surname, { message: 'Achternaam is verplicht' });
    required(schemaPath.email, { message: 'E-mail is verplicht' });
    email(schemaPath.email, { message: 'Ongeldig e-mailadres' });
    required(schemaPath.email2, { message: 'E-mail is verplicht' });
    email(schemaPath.email2, { message: 'Ongeldig e-mailadres' });
    min(schemaPath.amountOfPeopleDate1, 0);
    max(schemaPath.amountOfPeopleDate1, 20, {
      message: 'Aantal mensen mag maximaal 20 zijn',
    });
    min(schemaPath.amountOfPeopleDate2, 0);
    max(schemaPath.amountOfPeopleDate2, 20, {
      message: 'Aantal mensen mag maximaal 20 zijn',
    });
    // Custom validator for email matching
    validate(schemaPath.email2, ({ value, valueOf }) => {
      const email2Value = value();
      const emailValue = valueOf(schemaPath.email);
      if (email2Value && emailValue && email2Value !== emailValue) {
        return {
          kind: 'emailMismatch',
          message: 'E-mailadressen komen niet overeen',
        };
      }
      return null;
    });
  });

  saving = signal(false);

  // Reservation totals from API (privacy-safe - only numbers)
  totalPeopleDate1 = signal(0);
  totalPeopleDate2 = signal(0);
  loadingTotals = signal(false);

  // Email match status: 'match', 'mismatch', or 'empty'
  emailMatchStatus = computed(() => {
    const formData = this.reserveringModel();
    const email1 = formData.email;
    const email2 = formData.email2;
    if (
      !email1 ||
      !email2 ||
      email1.trim().length === 0 ||
      email2.trim().length === 0
    ) {
      return 'empty';
    }
    return email1 === email2 ? 'match' : 'mismatch';
  });

  // Check if reservation is allowed for each date (100 total limit)
  canReserveDate1 = computed(() => {
    const formData = this.reserveringModel();
    return this.totalPeopleDate1() + formData.amountOfPeopleDate1 <= 100;
  });

  canReserveDate2 = computed(() => {
    const formData = this.reserveringModel();
    return this.totalPeopleDate2() + formData.amountOfPeopleDate2 <= 100;
  });

  // Check if 20 ticket per day limit is exceeded
  exceeds20LimitDate1 = computed(() => {
    const formData = this.reserveringModel();
    return formData.amountOfPeopleDate1 > 20;
  });

  exceeds20LimitDate2 = computed(() => {
    const formData = this.reserveringModel();
    return formData.amountOfPeopleDate2 > 20;
  });

  // Check if limit is reached (for display purposes)
  limitReachedDate1 = computed(() => {
    return this.totalPeopleDate1() >= 100;
  });

  limitReachedDate2 = computed(() => {
    return this.totalPeopleDate2() >= 100;
  });

  formIsValid = computed(() => {
    // Don't allow submission if both dates are in the past
    if (this.isDatum1Past() && (!this.datum2 || this.isDatum2Past())) {
      return false;
    }
    if (
      this.datum2 &&
      this.isDatum2Past() &&
      (!this.datum1 || this.isDatum1Past())
    ) {
      return false;
    }

    const formData = this.reserveringModel();
    const formValid = this.reserveringForm().valid();
    const hasReservations =
      formData.amountOfPeopleDate1 > 0 || formData.amountOfPeopleDate2 > 0;

    return (
      formValid &&
      hasReservations &&
      this.canReserveDate1() &&
      this.canReserveDate2() &&
      !this.exceeds20LimitDate1() &&
      !this.exceeds20LimitDate2()
    );
  });

  loaded = signal(false);

  voorstellingOmschrijving = '';
  voorstellingsNaam = signal('');
  groepsNaam = signal('');
  datum1: Date | null = null;
  datum2: Date | null = null;
  today = new Date();

  isDatum1Past = computed(() => {
    if (!this.datum1) return false;
    // Check if current time is 8 hours or more before the performance time
    const eightHoursBefore = new Date(
      this.datum1.getTime() - 8 * 60 * 60 * 1000
    );
    return this.today >= eightHoursBefore;
  });

  isDatum2Past = computed(() => {
    if (!this.datum2) return false;
    // Check if current time is 8 hours or more before the performance time
    const eightHoursBefore = new Date(
      this.datum2.getTime() - 8 * 60 * 60 * 1000
    );
    return this.today >= eightHoursBefore;
  });

  @Input()
  voorstellingId: string | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadData();
    this.loaded.set(true);
  }

  async loadData(): Promise<void> {
    if (this.voorstellingId) {
      const voorstelling = await this.client.getOne<Voorstelling>(
        'voorstellingen',
        this.voorstellingId
      );

      this.voorstellingsNaam.set(voorstelling.titel);
      this.datum1 = new Date(voorstelling.datum_tijd_1 ?? '');
      this.datum2 = new Date(voorstelling.datum_tijd_2 ?? '');

      const groep = await this.client.getOne<Groep>(
        'groepen',
        voorstelling.groep
      );

      this.groepsNaam.set(groep.naam);

      // Add TheaterEvent structured data
      this.seoService.updateOpenGraphTags({
        title: `Reserveren - ${voorstelling.titel}`,
        description:
          voorstelling.omschrijving ||
          `Reserveer voor ${voorstelling.titel} door ${groep.naam}`,
        url: `https://tovedem.nergy.space/reserveren?voorstellingid=${voorstelling.id}`,
        type: 'website',
        siteName: 'Tovedem',
      });

      this.seoService.updateStructuredDataForEvent({
        name: voorstelling.titel,
        startDate: voorstelling.datum_tijd_1,
        endDate: voorstelling.datum_tijd_2 || voorstelling.datum_tijd_1,
        location: {
          name: 'De Schalm',
          address: {
            streetAddress: 'Orangjelaan 10',
            addressLocality: 'De Meern',
            postalCode: '3454 BT',
            addressCountry: 'NL',
          },
        },
        description: voorstelling.omschrijving,
        ...(voorstelling.afbeelding && {
          image: `https://pocketbase.nergy.space/api/files/${voorstelling.collectionId}/${voorstelling.id}/${voorstelling.afbeelding}`,
        }),
        performer: {
          name: groep.naam,
          '@type': 'TheaterGroup',
        },
        organizer: {
          name: groep.naam,
          url: `https://tovedem.nergy.space/groep/${groep.naam}`,
        },
        ...(voorstelling.prijs_per_kaartje && {
          offers: {
            price: voorstelling.prijs_per_kaartje,
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            url: `https://tovedem.nergy.space/reserveren?voorstellingid=${voorstelling.id}`,
          },
        }),
      });

      // Fetch reservation totals (privacy-safe API endpoint)
      await this.loadReservationTotals();
    }
  }

  async loadReservationTotals(): Promise<void> {
    if (!this.voorstellingId) return;

    this.loadingTotals.set(true);
    try {
      const response = await fetch(
        `${this.client.environment.pocketbase.baseUrl}/reserveringen/totals?voorstellingId=${this.voorstellingId}`
      );

      if (!response.ok) {
        console.error(
          'Failed to load reservation totals:',
          response.statusText
        );
        return;
      }

      const data = await response.json();
      this.totalPeopleDate1.set(data.datum_tijd_1_total || 0);
      this.totalPeopleDate2.set(data.datum_tijd_2_total || 0);
    } catch (error) {
      console.error('Error loading reservation totals:', error);
      // Don't block the form if totals fail to load - server-side validation will catch it
    } finally {
      this.loadingTotals.set(false);
    }
  }

  async saveReservering(): Promise<void> {
    if (!this.formIsValid()) {
      return;
    }

    // Double-check limits before submitting (client-side validation)
    if (!this.canReserveDate1() || !this.canReserveDate2()) {
      this.snackBar.open(
        'Het maximum aantal reserveringen is bereikt. Probeer een kleiner aantal.',
        '⚠️',
        {
          duration: 5000,
        }
      );
      return;
    }

    this.saving.set(true);

    try {
      const formData = this.reserveringModel();
      const nieuweReservering = await this.client.create<Reservering>(
        'reserveringen',
        {
          voornaam: formData.name,
          achternaam: formData.surname,
          email: formData.email,
          is_vriend_van_tovedem: formData.vriendVanTovedem,
          is_lid_van_vereniging: formData.lidVanTovedemMejotos,
          voorstelling: this.voorstellingId ?? '',
          datum_tijd_1_aantal: formData.amountOfPeopleDate1 ?? 0,
          datum_tijd_2_aantal: formData.amountOfPeopleDate2 ?? 0,
          guid: crypto.randomUUID(),
          opmerking: formData.opmerking,
        }
      );

      // Refresh totals after successful reservation
      await this.loadReservationTotals();

      //TO DO: pagina met reservering geslaagd. nog een maal alle gegevens op een rijtje ga terug naar hoofdscherm
      //Datum, aantal stoelen, welke naam, of ze gereserverde plekken gaan krijgen of niet, betalen aan de kassa melding (Pin en cash) kaart met route??

      this.router.navigate(['/reservering-geslaagd'], {
        queryParams: {
          voorstellingId: this.voorstellingId,
          reserveringId: nieuweReservering.id,
        },
      });

      this.snackBar.open('Reservering geslaagd!', '🥳🎉🎈', {
        duration: 5000,
      });
    } catch (error: unknown) {
      // Use ErrorService for consistent error handling
      const errorMessage = this.errorService.getErrorMessage(
        error,
        'Reservering aanmaken'
      );

      this.snackBar.open(errorMessage, '❌', {
        duration: 7000,
      });
    } finally {
      this.saving.set(false);
    }
  }

  constructor() {
    // Effect to enforce 20 ticket limit when amount changes
    effect(() => {
      const model = this.reserveringModel();
      let updated = false;
      let newModel = { ...model };

      if (model.amountOfPeopleDate1 > 20) {
        newModel.amountOfPeopleDate1 = 20;
        updated = true;
        this.snackBar.open(
          'Er kunnen niet meer dan 20 tickets gereserveerd worden voor 1 dag',
          '⚠️',
          { duration: 5000 }
        );
      }

      if (model.amountOfPeopleDate2 > 20) {
        newModel.amountOfPeopleDate2 = 20;
        updated = true;
        this.snackBar.open(
          'Er kunnen niet meer dan 20 tickets gereserveerd worden voor 1 dag',
          '⚠️',
          { duration: 5000 }
        );
      }

      if (updated) {
        this.reserveringModel.set(newModel);
      }
    });
  }

  incrementAmountDate1(): void {
    this.reserveringModel.update((model) => ({
      ...model,
      amountOfPeopleDate1: Math.min(20, model.amountOfPeopleDate1 + 1),
    }));
  }

  decrementAmountDate1(): void {
    this.reserveringModel.update((model) => ({
      ...model,
      amountOfPeopleDate1: Math.max(0, model.amountOfPeopleDate1 - 1),
    }));
  }

  incrementAmountDate2(): void {
    this.reserveringModel.update((model) => ({
      ...model,
      amountOfPeopleDate2: Math.min(20, model.amountOfPeopleDate2 + 1),
    }));
  }

  decrementAmountDate2(): void {
    this.reserveringModel.update((model) => ({
      ...model,
      amountOfPeopleDate2: Math.max(0, model.amountOfPeopleDate2 - 1),
    }));
  }
}
