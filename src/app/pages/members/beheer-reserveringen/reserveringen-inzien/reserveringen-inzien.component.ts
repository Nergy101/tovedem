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
import { Field, form, debounce } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import {
  MatButtonToggleChange,
  MatButtonToggleModule,
} from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, filter, lastValueFrom, map, startWith } from 'rxjs';
import { LosseVerkoop } from '../../../../models/domain/losse-verkoop.model';
import { Reservering } from '../../../../models/domain/reservering.model';
import { Sponsor } from '../../../../models/domain/sponsor.model';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { ReserveringSearchFormModel } from '../../../../models/form-models/reservering-search-form.model';
import { ConfirmatieDialogComponent } from '../../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { ReserveringenTableComponent } from '../../../../shared/components/reserveringen-table/reserveringen-table.component';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { VerificationService } from '../../../../shared/services/verification.service';
import { LosseVerkoopCreateDialogComponent } from '../losse-verkoop-create-dialog/losse-verkoop-create-dialog.component';
import { ReserveringEditDialogComponent } from '../reserveringen-edit-dialog/reservering-edit-dialog.component';
import { VerificatieMatchDialogComponent } from '../verificatie-match-dialog/verificatie-match-dialog.component';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    Field,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ReserveringenTableComponent,
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
  themeService = inject(ThemeService);
  verificationService = inject(VerificationService);

  loading = signal(false);
  searching = signal(false);
  searchTerm = signal('');
  searchTerm$ = toObservable(this.searchTerm);
  voorstellingen = signal<Voorstelling[]>([]);

  selectedVoorstelling = signal<Voorstelling | null>(null);

  selectedDag = signal<'datum1' | 'datum2'>('datum1');

  reserveringenOfSelectedVoorstelling = signal<Reservering[]>([]);
  losseVerkoopOfSelectedVoorstelling = signal<LosseVerkoop[]>([]);
  sponsors = signal<Sponsor[]>([]);
  losseVerkoopOfSelectedVoorstellingDag = computed(() => {
    return this.losseVerkoopOfSelectedVoorstelling().filter(
      (losseVerkoop) => losseVerkoop.datum === this.selectedDag()
    );
  });

  // Signal Forms: Create form model and form instance for search
  // NOTE: Signal Forms are experimental in Angular 21
  reservatieSearchModel = signal<ReserveringSearchFormModel>({
    searchTerm: ''
  });

  reservatieSearchForm = form(this.reservatieSearchModel, (schemaPath) => {
    debounce(schemaPath.searchTerm, 500);
  });

  filteredOptions: Observable<Reservering[]>;
  selectedOption = signal<Reservering | null>(null);

  seriesVoorDag = computed(() => {
    return this.selectedDag() === 'datum1'
      ? this.seriesDatum1()
      : this.seriesDatum2();
  });

  seriesDatum1 = computed(() => {
    const reserveringen = this.reserveringenOfSelectedVoorstelling();
    const voorstelling = this.selectedVoorstelling();

    let aanwezig = 0;
    let gereserveerd = 0;
    let vrij = voorstelling?.beschikbare_stoelen_datum_tijd_1 ?? 0;
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
        vrij -= losseVerkoop.aantal;
      }
    });

    return [aanwezig, losseVerkoopAantal, gereserveerd, vrij];
  });

  seriesDatum2 = computed(() => {
    const reserveringen = this.reserveringenOfSelectedVoorstelling();
    const voorstelling = this.selectedVoorstelling();

    let aanwezig = 0;
    let gereserveerd = 0;
    let vrij = voorstelling?.beschikbare_stoelen_datum_tijd_2 ?? 0;
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
        vrij -= losseVerkoop.aantal;
      }
    });

    return [aanwezig, losseVerkoopAantal, gereserveerd, vrij];
  });

  labels = computed<string[]>(() => {
    return ['Aanwezig', 'Losse Verkoop', 'Gereserveerd', 'Leeg'];
  });

  totalUsedDatum1 = computed(() => {
    const series = this.seriesDatum1();
    // Total used = aanwezig + losseVerkoop + gereserveerd (exclude vrij)
    return series[0] + series[1] + series[2];
  });

  totalUsedDatum2 = computed(() => {
    const series = this.seriesDatum2();
    // Total used = aanwezig + losseVerkoop + gereserveerd (exclude vrij)
    return series[0] + series[1] + series[2];
  });

  totalAvailableDatum1 = computed(() => {
    return this.selectedVoorstelling()?.beschikbare_stoelen_datum_tijd_1 ?? 0;
  });

  totalAvailableDatum2 = computed(() => {
    return this.selectedVoorstelling()?.beschikbare_stoelen_datum_tijd_2 ?? 0;
  });

  constructor() {
    this.selectedDag.set('datum1');

    // set Reserveringen Of Voorstelling
    effect(() => {
      const selectedVoorstelling = this.selectedVoorstelling();

      if (!selectedVoorstelling) {
        this.reserveringenOfSelectedVoorstelling.set([]);
        return;
      }

      this.loading.set(true);
      this.client.directClient
        .collection('reserveringen')
        .getFullList({
          filter: this.client.directClient.filter(
            'voorstelling.id = {:voorstellingId}',
            {
              voorstellingId: selectedVoorstelling.id,
            }
          ),
        })
        .then((reserveringen) => {
          this.reserveringenOfSelectedVoorstelling.set(
            reserveringen as unknown as Reservering[]
          );
          this.loading.set(false);
        })
        .catch(() => {
          this.loading.set(false);
        });
    });

    // set losse verkoop of selected voorstelling
    effect(() => {
      const selectedVoorstelling = this.selectedVoorstelling();

      if (!selectedVoorstelling) {
        this.losseVerkoopOfSelectedVoorstelling.set([]);
        return;
      }

      this.client.directClient
        .collection('losse_verkoop')
        .getFullList({
          filter: this.client.directClient.filter(
            'voorstelling.id = {:voorstellingId}',
            { voorstellingId: selectedVoorstelling.id }
          ),
        })
        .then((losseVerkoop) => {
          this.losseVerkoopOfSelectedVoorstelling.set(
            losseVerkoop as unknown as LosseVerkoop[]
          );
        });
    });

    // Convert Signal Forms model to Observable for autocomplete
    this.filteredOptions = toObservable(this.reservatieSearchModel).pipe(
      takeUntilDestroyed(),
      startWith(this.reservatieSearchModel()),
      map((model) => this._filter(model.searchTerm || ''))
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
      await this.client.directClient.collection('voorstellingen').getFullList({
        sort: 'datum_tijd_1',
        filter: 'gearchiveerd != true',
      })
    );

    // Load sponsors for verification matching
    this.sponsors.set(
      await this.client.directClient.collection('sponsoren').getFullList()
    );
  }

  setSelectedDag(event: MatButtonToggleChange): void {
    this.selectedDag.set(event.value);
  }

  async openEditDialog(reservering: Reservering): Promise<void> {
    const dialogData = {
      reservering,
      voorstelling: this.selectedVoorstelling(),
    };

    const dialogRef = this.dialog.open(ReserveringEditDialogComponent, {
      data: dialogData,
      hasBackdrop: true,
      // minWidth: '90vw'
    });

    const { updatedReservering } = await lastValueFrom(dialogRef.afterClosed());

    if (updatedReservering) {
      this.reserveringenOfSelectedVoorstelling.update((reserveringen) =>
        reserveringen.map((x) =>
          x.id === updatedReservering.id ? updatedReservering : x
        )
      );

      this.toastr.success('Reservering succesvol aangepast');
    }
  }

  clearReservatieSearch(): void {
    this.reservatieSearchModel.set({ searchTerm: '' });
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

  onCheckboxChange(event: { reservering: Reservering; dag: 1 | 2 }): void {
    const { reservering, dag } = event;
    if (dag === 1) {
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
        selectedDag: this.selectedDag(),
      },
    });

    const dialogResult = await lastValueFrom(dialogRef.afterClosed());

    if (dialogResult) {
      this.losseVerkoopOfSelectedVoorstelling.update((losseVerkoop) => [
        ...losseVerkoop,
        dialogResult,
      ]);
      this.toastr.success('Losse verkoop succesvol toegevoegd');
    }
  }

  async deleteLosseVerkoop(losseVerkoopToDelete: LosseVerkoop): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Losse verkoop verwijderen',
        message: 'Weet je zeker dat je de losse verkoop wilt verwijderen?',
      },
    });

    const dialogResult = await lastValueFrom(dialogRef.afterClosed());

    if (!dialogResult) return;

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

  /**
   * Open dialog for verification (always available, not just for partial matches)
   */
  async openVerificatieDialog(reservering: Reservering): Promise<void> {
    const { status, matchingSponsors } =
      this.verificationService.checkVerificationStatus(
        reservering,
        this.sponsors()
      );

    // Get all potential matches (both exact and partial) for display in dialog
    const allMatchingSponsors = this.verificationService.getAllMatchingSponsors(
      reservering,
      this.sponsors()
    );

    const dialogRef = this.dialog.open(VerificatieMatchDialogComponent, {
      data: {
        reservering,
        matchingSponsors: allMatchingSponsors,
        currentStatus: status as
          | 'verified'
          | 'partial'
          | 'unverified'
          | 'verified_no_membership'
          | 'unverified_no_membership',
      },
      hasBackdrop: true,
      minWidth: '600px',
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    if (result) {
      // If confirm vriend, set is_vriend_van_tovedem to true
      if (result.confirmVriend) {
        const updatedReservering: Reservering = {
          ...reservering,
          is_vriend_van_tovedem: true,
        };

        await this.client.update<Reservering>(
          'reserveringen',
          updatedReservering
        );

        // Update local state
        this.reserveringenOfSelectedVoorstelling.update((reserveringen) =>
          reserveringen.map((x) =>
            x.id === reservering.id ? updatedReservering : x
          )
        );

        this.toastr.success('Vriend status bevestigd');
      }
      // If reset, clear manual verification to recalculate automatically
      else if (result.reset) {
        const updatedReservering: Reservering = {
          ...reservering,
          verificatie_status: null,
          verificatie_sponsor_id: null,
        };

        await this.client.update<Reservering>(
          'reserveringen',
          updatedReservering
        );

        // Update local state
        this.reserveringenOfSelectedVoorstelling.update((reserveringen) =>
          reserveringen.map((x) =>
            x.id === reservering.id ? updatedReservering : x
          )
        );

        this.toastr.success(
          'Verificatie status gereset - wordt automatisch opnieuw berekend'
        );
      } else if (result.status) {
        // Update reservering with manual verification
        const updatedReservering: Reservering = {
          ...reservering,
          verificatie_status: result.status,
          verificatie_sponsor_id: result.sponsorId || null,
        };

        await this.client.update<Reservering>(
          'reserveringen',
          updatedReservering
        );

        // Update local state
        this.reserveringenOfSelectedVoorstelling.update((reserveringen) =>
          reserveringen.map((x) =>
            x.id === reservering.id ? updatedReservering : x
          )
        );

        this.toastr.success('Verificatie status bijgewerkt');
      }
    }
  }
}
