import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';

import { provideNativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';

import PocketBase from 'pocketbase';

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
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './reserveren.component.html',
  styleUrl: './reserveren.component.scss',
})
export class ReserverenComponent implements OnInit {
  url = 'https://tovedem.pockethost.io/';
  client: PocketBase;

  voorstellingsNaam = '';
  groepsNaam = '';
  datum1: Date | null = null;
  datum2: Date | null = null;
  today = new Date();

  name = '';
  surname = '';
  vriendVanTovedem = false;
  lidVanTovedemMejotos = false;
  amountOfPeopleDate1 = 0;
  amountOfPeopleDate2 = 0;

  @Input('voorstelling')
  voorstellingId: string | null = null;

  saving: boolean = false;

  constructor(private readonly _snackBar: MatSnackBar) {
    this.client = new PocketBase(this.url);
  }

  async ngOnInit(): Promise<void> {
    console.log('voorstellingId', this.voorstellingId);
    if (!!this.voorstellingId) {
      const voorstelling = (await this.client
        .collection('voorstellingen')
        .getOne(this.voorstellingId)) as any;

      console.log(voorstelling);
      this.voorstellingsNaam = voorstelling.titel;
      this.datum1 = new Date(voorstelling.datum_tijd_1);
      this.datum2 = new Date(voorstelling.datum_tijd_2);

      const groep = (await this.client
        .collection('groepen')
        .getOne(voorstelling.groep)) as any;

      console.log(groep);
      this.groepsNaam = groep.naam;
    }
  }

  saveReservering(): void {
    this.saving = true;

    this.client.collection('reserveringen').create({
      voornaam: this.name,
      achternaam: this.surname,
      is_vriend_van_tovedem: this.vriendVanTovedem,
      is_lid_van_vereniging: this.lidVanTovedemMejotos,
      voorstelling: this.voorstellingId,
      datum_tijd_1_aantal: this.amountOfPeopleDate1,
      datum_tijd_2_aantal: this.amountOfPeopleDate2,
    });

    this.name = '';
    this.surname = '';
    this.vriendVanTovedem = false;
    this.lidVanTovedemMejotos = false;
    this.amountOfPeopleDate1 = 0;
    this.amountOfPeopleDate2 = 0;

    this.saving = false;
    this._snackBar.open('Reservering geslaagd!', '🥳🎉🎈', {
      duration: 5000,
    });
  }
}
