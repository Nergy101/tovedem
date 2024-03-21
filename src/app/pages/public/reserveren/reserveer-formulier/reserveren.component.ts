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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { CommonModule } from '@angular/common';

import PocketBase from 'pocketbase';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { lastValueFrom } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import Voorstelling from '../../../../models/domain/voorstelling.model';
import Groep from '../../../../models/domain/groep.model';
import Reservering from '../../../../models/domain/resservering.model';

@Component({
  selector: 'app-reserveren',
  standalone: true,
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
  url = 'https://tovedem.pockethost.io/';
  client = inject(PocketbaseService);
  snackBar = inject(MatSnackBar);

  router = inject(Router);
  name = signal('');
  surname = signal('');
  email = signal('');
  vriendVanTovedem = signal(false);
  lidVanTovedemMejotos = signal(false);
  amountOfPeopleDate1 = signal(0);
  amountOfPeopleDate2 = signal(0);
  saving = signal(false);

  formIsValid = computed(() => {
    return (
      !!this.name() &&
      !!this.email &&
      !!this.surname &&
      (this.amountOfPeopleDate1() > 0 || this.amountOfPeopleDate2() > 0)
    );
  });

  loaded: boolean = false;

  voorstellingOmschrijving = '';
  voorstellingsNaam = '';
  groepsNaam = '';
  datum1: Date | null = null;
  datum2: Date | null = null;
  today = new Date();

  @Input('voorstelling')
  voorstellingId: string | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadData();
    this.loaded = true;
  }

  async loadData(): Promise<void> {
    if (!!this.voorstellingId) {
      const voorstelling = await this.client.getOne<Voorstelling>(
        'voorstellingen',
        this.voorstellingId
      );

      this.voorstellingsNaam = voorstelling.titel;
      this.datum1 = new Date(voorstelling.datum_tijd_1);
      this.datum2 = new Date(voorstelling.datum_tijd_2);

      const groep = await this.client.getOne<Groep>(
        'groepen',
        voorstelling.groep
      );

      this.groepsNaam = groep.naam;
    }
  }

  async saveReservering(): Promise<void> {
    this.saving.set(true);

    const nieuweReservering = await this.client.create<Reservering>(
      'reserveringen',
      {
        voornaam: this.name,
        achternaam: this.surname,
        email: this.email,
        is_vriend_van_tovedem: this.vriendVanTovedem,
        is_lid_van_vereniging: this.lidVanTovedemMejotos,
        voorstelling: this.voorstellingId,
        datum_tijd_1_aantal: this.amountOfPeopleDate1 ?? 0,
        datum_tijd_2_aantal: this.amountOfPeopleDate2 ?? 0,
      }
    );

    //TO DO: pagina met reservering geslaagd. nog een maal alle gegevens op een rijtje ga terug naar hoofdscherm
    //Datum, aantal stoelen, welke naam, of ze gereserverde plekken gaan krijgen of niet, betalen aan de kassa melding (Pin en cash) kaart met route??

    this.router.navigate(['/reservering-geslaagd'], {
      queryParams: {
        voorstelling: this.voorstellingId,
        reservering: nieuweReservering.id,
      },
    });

    this.snackBar.open('Reservering geslaagd!', '🥳🎉🎈', {
      duration: 5000,
    });
  }

  onEmailChanged(newValue: string) {
    this.email.set(newValue);
  }

  onNameChanged(newValue: string) {
    this.name.set(newValue);
  }

  onSurnameChanged(newValue: string) {
    this.surname.set(newValue);
  }

  vriendVanTovedemChanged(newValue: boolean) {
    this.vriendVanTovedem.set(newValue);
  }

  lidVanTovedemMejotosChanged(newValue: boolean) {
    this.lidVanTovedemMejotos.set(newValue);
  }

  amountOfPeopleDate1Changed(newValue: number) {
    this.amountOfPeopleDate1.set(newValue);
  }

  amountOfPeopleDate2Changed(newValue: number) {
    this.amountOfPeopleDate2.set(newValue);
  }
}
