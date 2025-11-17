import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { SeoService } from '../../../../shared/services/seo.service';

@Component({
  selector: 'app-reserveren',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
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

  router = inject(Router);
  name = signal('');
  surname = signal('');

  email = signal('');
  email2 = signal('');

  vriendVanTovedem = signal(false);
  lidVanTovedemMejotos = signal(false);
  opmerking = signal('');
  opmerkingLength = signal('');
  amountOfPeopleDate1 = signal(0);
  amountOfPeopleDate2 = signal(0);
  saving = signal(false);

  // Reservation totals from API (privacy-safe - only numbers)
  totalPeopleDate1 = signal(0);
  totalPeopleDate2 = signal(0);
  loadingTotals = signal(false);

  emailsAreSame = computed(() => {
    const email1 = this.email();
    const email2 = this.email2();
    // Only return true if both emails are non-empty and match
    return email1.length > 0 && email2.length > 0 && email1 === email2;
  });

  // Validation state signals
  nameValid = computed(() => !!this.name() && this.name().trim().length > 0);
  surnameValid = computed(() => !!this.surname() && this.surname().trim().length > 0);
  emailValid = computed(() => {
    const emailValue = this.email();
    if (!emailValue || emailValue.trim().length === 0) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  });
  email2Valid = computed(() => {
    const email2Value = this.email2();
    if (!email2Value || email2Value.trim().length === 0) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email2Value);
  });

  // Email match status: 'match', 'mismatch', or 'empty'
  emailMatchStatus = computed(() => {
    const email1 = this.email();
    const email2 = this.email2();
    if (!email1 || !email2 || email1.trim().length === 0 || email2.trim().length === 0) {
      return 'empty';
    }
    return email1 === email2 ? 'match' : 'mismatch';
  });

  // Check if reservation is allowed for each date
  canReserveDate1 = computed(() => {
    return this.totalPeopleDate1() + this.amountOfPeopleDate1() <= 100;
  });

  canReserveDate2 = computed(() => {
    return this.totalPeopleDate2() + this.amountOfPeopleDate2() <= 100;
  });

  // Check if limit is reached (for display purposes)
  limitReachedDate1 = computed(() => {
    return this.totalPeopleDate1() >= 100;
  });

  limitReachedDate2 = computed(() => {
    return this.totalPeopleDate2() >= 100;
  });

  // Form progress indicator (0-100%)
  formProgress = computed(() => {
    // Only count progress if user has started filling the form
    const hasStarted = this.name().length > 0 || this.surname().length > 0 || 
                       this.email().length > 0 || this.email2().length > 0 ||
                       this.amountOfPeopleDate1() > 0 || this.amountOfPeopleDate2() > 0;
    
    if (!hasStarted) {
      return 0;
    }
    
    // Count completed required fields
    const requiredFields = [
      this.nameValid(),
      this.surnameValid(),
      this.emailValid(),
      this.email2Valid(),
      this.emailsAreSame(), // Only true when both emails are filled and match
      this.amountOfPeopleDate1() > 0 || this.amountOfPeopleDate2() > 0,
    ];
    const completedFields = requiredFields.filter(Boolean).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  });

  formIsValid = computed(() => {
    return (
      this.nameValid() &&
      this.emailValid() &&
      this.email2Valid() &&
      this.emailsAreSame() &&
      this.surnameValid() &&
      (this.amountOfPeopleDate1() > 0 || this.amountOfPeopleDate2() > 0) &&
      this.canReserveDate1() &&
      this.canReserveDate2()
    );
  });

  loaded = false;

  voorstellingOmschrijving = '';
  voorstellingsNaam = '';
  groepsNaam = '';
  datum1: Date | null = null;
  datum2: Date | null = null;
  today = new Date();

  @Input()
  voorstellingId: string | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadData();
    this.loaded = true;
  }

  async loadData(): Promise<void> {
    if (this.voorstellingId) {
      const voorstelling = await this.client.getOne<Voorstelling>(
        'voorstellingen',
        this.voorstellingId
      );

      this.voorstellingsNaam = voorstelling.titel;
      this.datum1 = new Date(voorstelling.datum_tijd_1 ?? '');
      this.datum2 = new Date(voorstelling.datum_tijd_2 ?? '');

      const groep = await this.client.getOne<Groep>(
        'groepen',
        voorstelling.groep
      );

      this.groepsNaam = groep.naam;

      // Add TheaterEvent structured data
      this.seoService.updateOpenGraphTags({
        title: `Reserveren - ${voorstelling.titel}`,
        description: voorstelling.omschrijving || `Reserveer voor ${voorstelling.titel} door ${groep.naam}`,
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
      const nieuweReservering = await this.client.create<Reservering>(
        'reserveringen',
        {
          voornaam: this.name(),
          achternaam: this.surname(),
          email: this.email(),
          is_vriend_van_tovedem: this.vriendVanTovedem(),
          is_lid_van_vereniging: this.lidVanTovedemMejotos(),
          voorstelling: this.voorstellingId ?? '',
          datum_tijd_1_aantal: this.amountOfPeopleDate1() ?? 0,
          datum_tijd_2_aantal: this.amountOfPeopleDate2() ?? 0,
          guid: crypto.randomUUID(),
          opmerking: this.opmerking(),
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
    } catch (error: any) {
      console.error('Error creating reservation:', error);

      // Handle server-side validation errors
      let errorMessage =
        'Er is een fout opgetreden bij het reserveren. Probeer het later opnieuw.';

      // PocketBase errors have different structures
      if (error?.response?.message) {
        errorMessage = error.response.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      this.snackBar.open(errorMessage, '❌', {
        duration: 7000,
      });
    } finally {
      this.saving.set(false);
    }
  }

  onEmailChanged(newValue: string): void {
    this.email.set(newValue);
  }

  onEmail2Changed(newValue: string): void {
    this.email2.set(newValue);
  }

  onNameChanged(newValue: string): void {
    this.name.set(newValue);
  }

  onSurnameChanged(newValue: string): void {
    this.surname.set(newValue);
  }

  vriendVanTovedemChanged(newValue: boolean): void {
    this.vriendVanTovedem.set(newValue);
  }

  lidVanTovedemMejotosChanged(newValue: boolean): void {
    this.lidVanTovedemMejotos.set(newValue);
  }

  amountOfPeopleDate1Changed(newValue: number): void {
    this.amountOfPeopleDate1.set(newValue);
  }

  amountOfPeopleDate2Changed(newValue: number): void {
    this.amountOfPeopleDate2.set(newValue);
  }

  onOpmerkingChange(newValue: string): void {
    this.opmerking.set(newValue);
  }

  onOpmerkingChange2(event: Event): void {
    this.opmerkingLength.set((event.target as HTMLInputElement).value);
  }
}
