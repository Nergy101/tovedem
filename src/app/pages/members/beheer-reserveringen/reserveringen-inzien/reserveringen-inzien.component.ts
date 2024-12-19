import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Observable, filter, lastValueFrom, map, startWith, tap } from 'rxjs';
import { Reservering } from '../../../../models/domain/reservering.model';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { ActivatedRoute, Router } from '@angular/router';
import { LosseVerkoop } from '../../../../models/domain/losse-verkoop.model';
import { MatDialog } from '@angular/material/dialog';
import { LosseVerkoopCreateDialogComponent } from '../losse-verkoop-create-dialog/losse-verkoop-create-dialog.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reserveringen-inzien',
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
    ReactiveFormsModule,
  ],
  templateUrl: './reserveringen-inzien.component.html',
  styleUrl: './reserveringen-inzien.component.scss',
})
export class ReserveringenInzienComponent implements OnInit {
  client = inject(PocketbaseService);
  path = inject(ActivatedRoute);
  router = inject(Router);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);

  loading = signal(false);
  searching = signal(false);
  searchTerm = signal('');
  searchTerm$ = toObservable(this.searchTerm);
  voorstellingen = signal<Voorstelling[]>([]);

  selectedVoorstelling = signal<Voorstelling | null>(null);
  reserveringenOfSelectedVoorstelling = signal<Reservering[]>([]);
  losseVerkoopOfSelectedVoorstelling = signal<LosseVerkoop[]>([]);
  reservatieSearchControl = new FormControl('');
  filteredOptions: Observable<Reservering[]>;
  selectedOption = signal<Reservering | null>(null);

  seriesDatum1 = computed(() => {
    const reserveringen = this.reserveringenOfSelectedVoorstelling();
    let aanwezig = 0;
    let gereserveerd = 0;
    let vrij = 80;
    let losseVerkoopAantal = 0;

    reserveringen.forEach((reservering) => {
      if (reservering.aanwezig_datum_1) {
        aanwezig += reservering.datum_tijd_1_aantal;
      } else {
        gereserveerd += reservering.datum_tijd_1_aantal;
      }
      vrij -= reservering.datum_tijd_1_aantal;
    });

    this.losseVerkoopOfSelectedVoorstelling().forEach((losseVerkoop) => {
      if (losseVerkoop.datum === 'datum1') {
        losseVerkoopAantal += losseVerkoop.aantal;
      }
    });

    return [aanwezig, losseVerkoopAantal, gereserveerd, vrij];
  });

  seriesDatum2 = computed(() => {
    const reserveringen = this.reserveringenOfSelectedVoorstelling();
    let aanwezig = 0;
    let gereserveerd = 0;
    let vrij = 80;
    let losseVerkoopAantal = 0;

    reserveringen.forEach((reservering) => {
      if (reservering.aanwezig_datum_2) {
        aanwezig += reservering.datum_tijd_2_aantal;
      } else {
        gereserveerd += reservering.datum_tijd_2_aantal;
      }
      vrij -= reservering.datum_tijd_2_aantal;
    });

    this.losseVerkoopOfSelectedVoorstelling().forEach((losseVerkoop) => {
      if (losseVerkoop.datum === 'datum2') {
        losseVerkoopAantal += losseVerkoop.aantal;
      }
    });

    return [aanwezig, losseVerkoopAantal, gereserveerd, vrij];
  });

  labels = computed<string[]>(() => {
    return ['Aanwezig', 'Losse Verkoop', 'Gereserveerd', 'Leeg'];
  });

  constructor() {
    // set Reserveringen Of Voorstelling
    effect(async () => {
      const selectedVoorstelling = this.selectedVoorstelling();

      if (!selectedVoorstelling) return;

      const reserveringen = await this.client.getAll<Reservering>(
        'reserveringen',
        {
          filter: this.client.client.filter(
            'voorstelling.id = {:voorstellingId}',
            {
              voorstellingId: selectedVoorstelling.id,
            }
          ),
        }
      );

      this.reserveringenOfSelectedVoorstelling.set(reserveringen);
    });

    // set losse verkoop of selected voorstelling
    effect(async () => {
      const selectedVoorstelling = this.selectedVoorstelling();

      if (!selectedVoorstelling) return;

      const losseVerkoop = await this.client.getAll<LosseVerkoop>(
        'losse_verkoop',
        {
          filter: this.client.client.filter(
            'voorstelling.id = {:voorstellingId}',
            { voorstellingId: selectedVoorstelling.id }
          ),
        }
      );

      this.losseVerkoopOfSelectedVoorstelling.set(losseVerkoop);
    });

    this.filteredOptions = this.reservatieSearchControl.valueChanges.pipe(
      takeUntilDestroyed(),
      startWith(''),
      filter((x) => typeof x === 'string'),
      map((filter) => this._filter(filter || ''))
    );

    effect(() => {
      const voorstellingId = this.path.snapshot.queryParams['voorstellingId'];
      if (voorstellingId) {
        const voorstelling =
          this.voorstellingen().find(
            (voorstelling) => voorstelling.id === voorstellingId
          ) ?? null;
        this.selectedVoorstelling.set(voorstelling);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.voorstellingen.set(
      await this.client.getAll<Voorstelling>('voorstellingen', {
        sort: '-datum_tijd_1',
      })
    );
  }

  clearReservatieSearch(): void {
    this.reservatieSearchControl.setValue('');
    this.selectedOption.set(null);
  }

  setSelectedVoorstelling(event: MatSelectChange): void {
    this.selectedVoorstelling.set(event.value);
    this.router.navigate([], {
      queryParams: { voorstellingId: event.value.id },
    });
  }

  setSelectedOption(value: Reservering): void {
    this.selectedOption.set(
      this.reserveringenOfSelectedVoorstelling().find(
        (x) => x.id === value.id
      ) ?? null
    );
  }

  displayFn(reservering: Reservering | undefined): string {
    if (!reservering) return '';
    return `${reservering.voornaam} ${reservering.achternaam} - ${reservering.email}`;
  }

  onCheckboxChange(reservering: Reservering, dag_1_of_2: number): void {
    if (dag_1_of_2 === 1) {
      reservering.aanwezig_datum_1 = !reservering.aanwezig_datum_1;
    } else {
      reservering.aanwezig_datum_2 = !reservering.aanwezig_datum_2;
    }

    this.client.update<Reservering>('reserveringen', reservering);

    this.reserveringenOfSelectedVoorstelling.update((reserveringen) =>
      reserveringen.map((x) => (x.id === reservering.id ? reservering : x))
    );
  }

  async addLosseVerkoop(): Promise<void> {
    const selectedVoorstelling = this.selectedVoorstelling();

    if (!selectedVoorstelling) return;

    const dialogRef = this.dialog.open(LosseVerkoopCreateDialogComponent, {
      data: {
        voorstelling: selectedVoorstelling,
      },
    });

    const dialogResult = await lastValueFrom(dialogRef.afterClosed());

    this.losseVerkoopOfSelectedVoorstelling.update((losseVerkoop) => [
      ...losseVerkoop,
      dialogResult,
    ]);

    this.toastr.success('Losse verkoop succesvol toegevoegd');
  }

  async deleteLosseVerkoop(losseVerkoopToDelete: LosseVerkoop): Promise<void> {
    await this.client.delete('losse_verkoop', losseVerkoopToDelete.id);
    this.losseVerkoopOfSelectedVoorstelling.update((losseVerkoop) =>
      losseVerkoop.filter((x) => x.id !== losseVerkoopToDelete.id)
    );

    this.toastr.success('Losse verkoop succesvol verwijderd');
  }

  private _filter(value: string): Reservering[] {
    const filterValue = value.toLowerCase();

    return this.reserveringenOfSelectedVoorstelling().filter(
      (option) =>
        option.voornaam.toLowerCase().includes(filterValue) ||
        option.achternaam.toLowerCase().includes(filterValue) ||
        option.email.toLowerCase().includes(filterValue)
    );
  }
}
