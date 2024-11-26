import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Observable, filter, map, startWith } from 'rxjs';
import { Reservering } from '../../../../models/domain/reservering.model';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-reserveringen-inzien',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    DatePipe,
    MatExpansionModule,
    PieChartComponent,
    MatCardModule,
    MatAutocompleteModule,
    ReactiveFormsModule
  ],
  templateUrl: './reserveringen-inzien.component.html',
  styleUrl: './reserveringen-inzien.component.scss'
})
export class ReserveringenInzienComponent implements OnInit {

  loading = signal(false);
  searching = signal(false)
  client = inject(PocketbaseService);
  searchTerm = signal('');
  searchTerm$ = toObservable(this.searchTerm);
  voorstellingen = signal<Voorstelling[]>([]);

  selectedVoorstelling = signal<Voorstelling | null>(null);
  reserveringenOfSelectedVoorstelling = signal<Reservering[]>([]);

  reservatieSearchControl = new FormControl('');
  filteredOptions: Observable<Reservering[]>;
  selectedOption = signal<Reservering | null>(null);

  constructor() {
    // set Reserveringen Of Voorstelling
    effect(async () => {
      const selectedVoorstelling = this.selectedVoorstelling()

      if (!selectedVoorstelling) return;

      const reserveringen =
        await this.client.getAll<Reservering>("reserveringen",
          {
            filter: this.client.client.filter(
              'voorstelling.id = {:voorstellingId}', {
              voorstellingId: selectedVoorstelling.id
            }
            )
          });

      console.log("reserveringen", reserveringen)

      this.reserveringenOfSelectedVoorstelling.set(reserveringen)
    }, { allowSignalWrites: true })

    this.filteredOptions = this.reservatieSearchControl.valueChanges.pipe(
      takeUntilDestroyed(),
      startWith(''),
      filter(x => typeof (x) === 'string'),
      map(filter => this._filter(filter || '')),
    );
  }

  private _filter(value: string): Reservering[] {
    console.log('filtering value', value)
    const filterValue = value.toLowerCase();

    return this.reserveringenOfSelectedVoorstelling()
      .filter(option =>
        option.voornaam.toLowerCase().includes(filterValue)
        || option.achternaam.toLowerCase().includes(filterValue)
        || option.email.toLowerCase().includes(filterValue));
  }

  async ngOnInit(): Promise<void> {
    this.voorstellingen.set(await this.client.getAll<Voorstelling>("voorstellingen", {
      sort: '-datum_tijd_1'
    }))
  }

  setSelectedVoorstelling(event: MatSelectChange): void {
    this.selectedVoorstelling.set(event.value)
  }

  setSelectedOption(value: Reservering) {
    this.selectedOption.set(this.reserveringenOfSelectedVoorstelling()
      .find(x => x.id === value.id)
      ?? null);
  }

  displayFn(reservering: Reservering | undefined): string {
    if (!reservering) return ''
    return `${reservering.voornaam} ${reservering.achternaam} - ${reservering.email}`
  }

  seriesDatum1 = computed(() => {
    const reserveringen = this.reserveringenOfSelectedVoorstelling();

    const gereserveerd = reserveringen.reduce((acc, reservering) => acc + reservering.datum_tijd_1_aantal, 0)
    const vrij = reserveringen.reduce((acc, reservering) => acc - reservering.datum_tijd_1_aantal, 80)

    return [gereserveerd, vrij];
  })

  seriesDatum2 = computed(() => {
    const reserveringen = this.reserveringenOfSelectedVoorstelling();

    const gereseveerd = reserveringen.reduce((acc, reservering) => acc + reservering.datum_tijd_2_aantal, 0)
    const vrij = reserveringen.reduce((acc, reservering) => acc - reservering.datum_tijd_2_aantal, 80)

    return [gereseveerd, vrij];
  })

  labels = computed<string[]>(() => {
    return ['Gereserveerd', 'Vrij']
  })
}
