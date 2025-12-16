import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Reservering } from '../../../models/domain/reservering.model';
import { Sponsor } from '../../../models/domain/sponsor.model';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { inject } from '@angular/core';
import { VerificationService } from '../../../shared/services/verification.service';

@Component({
  selector: 'app-reserveringen-table',
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSortModule,
    CurrencyPipe,
  ],
  templateUrl: './reserveringen-table.component.html',
  styleUrl: './reserveringen-table.component.scss',
})
export class ReserveringenTableComponent {
  reserveringen = input.required<Reservering[]>();
  selectedVoorstelling = input.required<Voorstelling | null>();
  selectedDag = input.required<'datum1' | 'datum2'>();
  sponsors = input.required<Sponsor[]>();
  showEditButton = input<boolean>(true);
  showVerificationColumn = input<boolean>(true);

  checkboxChange = output<{ reservering: Reservering; dag: 1 | 2 }>();
  editClick = output<Reservering>();
  verificationClick = output<Reservering>();

  verificationService = inject(VerificationService);

  sortState = signal<Sort>({ active: '', direction: '' });

  sortedReserveringen = computed(() => {
    const reserveringen = this.reserveringen();
    const sort = this.sortState();
    const selectedDag = this.selectedDag();

    // Filter out reservations with 0 tickets for the selected day
    const filtered = reserveringen.filter((r) => {
      const aantal =
        selectedDag === 'datum1'
          ? r.datum_tijd_1_aantal
          : r.datum_tijd_2_aantal;
      return aantal > 0;
    });

    if (!sort.active || !sort.direction) {
      return filtered;
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      if (sort.active === 'voornaam') {
        aValue = a.voornaam.toLowerCase();
        bValue = b.voornaam.toLowerCase();
      } else if (sort.active === 'achternaam') {
        aValue = a.achternaam.toLowerCase();
        bValue = b.achternaam.toLowerCase();
      } else {
        return 0;
      }

      if (aValue < bValue) {
        return sort.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  });

  onSortChange(sort: Sort): void {
    this.sortState.set(sort);
  }

  getVerificationStatus(reservering: Reservering): string {
    return this.verificationService.getVerificationStatus(
      reservering,
      this.sponsors()
    );
  }

  onCheckboxChange(reservering: Reservering, dag: 1 | 2): void {
    this.checkboxChange.emit({ reservering, dag });
  }

  onEditClick(reservering: Reservering): void {
    this.editClick.emit(reservering);
  }

  onVerificationClick(reservering: Reservering): void {
    this.verificationClick.emit(reservering);
  }

  getAantal(reservering: Reservering): number {
    return this.selectedDag() === 'datum1'
      ? reservering.datum_tijd_1_aantal
      : reservering.datum_tijd_2_aantal;
  }

  getAanwezig(reservering: Reservering): boolean {
    return this.selectedDag() === 'datum1'
      ? reservering.aanwezig_datum_1
      : reservering.aanwezig_datum_2;
  }

  getPrijsPerKaartje(): number {
    return this.selectedVoorstelling()?.prijs_per_kaartje ?? 0;
  }
}
