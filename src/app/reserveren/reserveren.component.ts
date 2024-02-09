import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';

import { provideNativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
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
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './reserveren.component.html',
  styleUrl: './reserveren.component.scss',
})
export class ReserverenComponent {
  voorstellingsNaam = 'VoorstellingsNaam';
  groepsNaam = 'Tovedem';
  name = '';
  surname = '';
  vriendVanTovedem = false;
  lidVanTovedemMejotos = false;
  amountOfPeopleDate1 = 1;
  amountOfPeopleDate2 = 1;

  datum1: Date | null = new Date('2024-03-21');
  datum2: Date | null = new Date('2024-03-21');

  saveReservering(): void {
    throw new Error('Method not implemented.');
  }
}
