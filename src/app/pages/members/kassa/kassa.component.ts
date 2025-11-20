import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, tap } from 'rxjs';
import { LosseVerkoop } from '../../../models/domain/losse-verkoop.model';
import { Reservering } from '../../../models/domain/reservering.model';
import { Sponsor } from '../../../models/domain/sponsor.model';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { ReserveringenTableComponent } from '../../../shared/components/reserveringen-table/reserveringen-table.component';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { InformatieDialogComponent } from '../../../shared/components/informatie-dialog/informatie-dialog.component';
import { PieChartComponent } from '../beheer-reserveringen/reserveringen-inzien/pie-chart/pie-chart.component';
import { LosseVerkoopCreateDialogComponent } from '../beheer-reserveringen/losse-verkoop-create-dialog/losse-verkoop-create-dialog.component';
import { ReserveringEditDialogComponent } from '../beheer-reserveringen/reserveringen-edit-dialog/reservering-edit-dialog.component';
import { VerificatieMatchDialogComponent } from '../beheer-reserveringen/verificatie-match-dialog/verificatie-match-dialog.component';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { VerificationService } from '../../../shared/services/verification.service';
import {
  findVoorstellingenForToday,
  getVoorstellingDagForDate,
  isDateToday,
} from '../../../shared/utils/date.utils';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-kassa',
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    DatePipe,
    CurrencyPipe,
    ReserveringenTableComponent,
    PieChartComponent,
  ],
  templateUrl: './kassa.component.html',
  styleUrl: './kassa.component.scss',
})
export class KassaComponent implements OnInit {
  loading = signal(false);
  searching = signal(false);
  client = inject(PocketbaseService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);
  authService = inject(AuthService);
  titleService = inject(Title);
  verificationService = inject(VerificationService);

  searchTerm = signal('');
  searchTerm$ = toObservable(this.searchTerm);

  voorstellingen = signal<Voorstelling[]>([]);
  voorstellingenVoorVandaag = signal<Voorstelling[]>([]);
  selectedVoorstelling = signal<Voorstelling | null>(null);
  selectedDag = signal<'datum1' | 'datum2'>('datum1');

  reserveringen = signal<Reservering[]>([]);
  filteredReserveringen = signal<Reservering[]>([]);
  sponsors = signal<Sponsor[]>([]);
  losseVerkoop = signal<LosseVerkoop[]>([]);
  losseVerkoopOfSelectedVoorstellingDag = computed(() => {
    const selectedVoorstelling = this.selectedVoorstelling();
    if (!selectedVoorstelling) return [];
    return this.losseVerkoop().filter(
      (losseVerkoop) =>
        losseVerkoop.voorstelling === selectedVoorstelling.id &&
        losseVerkoop.datum === this.selectedDag()
    );
  });

  seriesDatum1 = computed(() => {
    const reserveringen = this.reserveringen();
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

    this.losseVerkoop().forEach((losseVerkoop) => {
      const selectedVoorstelling = this.selectedVoorstelling();
      if (
        selectedVoorstelling &&
        losseVerkoop.voorstelling === selectedVoorstelling.id &&
        losseVerkoop.datum === 'datum1'
      ) {
        losseVerkoopAantal += losseVerkoop.aantal;
        vrij -= losseVerkoop.aantal;
      }
    });

    return [aanwezig, losseVerkoopAantal, gereserveerd, vrij];
  });

  seriesDatum2 = computed(() => {
    const reserveringen = this.reserveringen();
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

    this.losseVerkoop().forEach((losseVerkoop) => {
      const selectedVoorstelling = this.selectedVoorstelling();
      if (
        selectedVoorstelling &&
        losseVerkoop.voorstelling === selectedVoorstelling.id &&
        losseVerkoop.datum === 'datum2'
      ) {
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

  isAdmin = computed(() => {
    // Check if user is logged in first
    if (!this.authService.isLoggedIn()) {
      return false;
    }
    return (
      this.authService.isGlobalAdmin ||
      this.authService.userHasAllRoles(['admin'])
    );
  });

  constructor() {
    this.titleService.setTitle('Tovedem - De Kassa');

    // Debounced search
    this.searchTerm$
      .pipe(
        tap(() => this.searching.set(true)),
        debounceTime(500),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.filterReserveringen();
        this.searching.set(false);
      });
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);

    try {
      // Load all voorstellingen using typed collection
      const voorstellingenCollection =
        this.client.directClient.collection('voorstellingen');
      const alleVoorstellingen = (await voorstellingenCollection.getFullList({
        sort: '-datum_tijd_1',
        filter: 'gearchiveerd != true',
      })) as Voorstelling[];
      this.voorstellingen.set(alleVoorstellingen);

      // Find voorstellingen for today
      const voorstellingenVandaag =
        findVoorstellingenForToday(alleVoorstellingen);
      this.voorstellingenVoorVandaag.set(voorstellingenVandaag);

      if (voorstellingenVandaag.length === 0) {
        this.loading.set(false);
        return;
      }

      // Use the first voorstelling for today (or could show all)
      const eersteVoorstelling = voorstellingenVandaag[0];
      this.selectedVoorstelling.set(eersteVoorstelling);

      // Determine which dag (datum1 or datum2) is today
      const dag = getVoorstellingDagForDate(eersteVoorstelling, new Date());
      if (dag) {
        this.selectedDag.set(dag);
      }

      // Load sponsors for verification using typed collection
      const sponsorsCollection =
        this.client.directClient.collection('sponsoren');
      const alleSponsors =
        (await sponsorsCollection.getFullList()) as Sponsor[];
      this.sponsors.set(alleSponsors);

      // Load reserveringen for all voorstellingen today
      await this.loadReserveringenVoorVandaag();
      
      // Load losse verkoop for selected voorstelling
      await this.loadLosseVerkoop();
    } catch (error) {
      console.error('Error loading data:', error);
      this.toastr.error('Fout bij het laden van gegevens');
    } finally {
      this.loading.set(false);
    }
  }

  async loadReserveringenVoorVandaag(): Promise<void> {
    const voorstellingenVandaag = this.voorstellingenVoorVandaag();
    const vandaag = new Date();

    const alleReserveringen: Reservering[] = [];

    for (const voorstelling of voorstellingenVandaag) {
      // Use typed collection for reserveringen
      const reserveringenCollection =
        this.client.directClient.collection('reserveringen');
      const reserveringen = (await reserveringenCollection.getFullList({
        filter: this.client.directClient.filter(
          'voorstelling.id = {:voorstellingId}',
          {
            voorstellingId: voorstelling.id,
          }
        ),
        expand: 'voorstelling',
      })) as Reservering[];

      // Filter reserveringen where datum_tijd_1 or datum_tijd_2 matches today
      const reserveringenVoorVandaag = reserveringen.filter((reservering) => {
        // Check if this reservering has a reservation for today
        const dag = getVoorstellingDagForDate(voorstelling, vandaag);
        if (!dag) return false;

        // Check if the reservering has tickets for this dag
        if (dag === 'datum1' && reservering.datum_tijd_1_aantal > 0) {
          return true;
        }
        if (dag === 'datum2' && reservering.datum_tijd_2_aantal > 0) {
          return true;
        }
        return false;
      });

      alleReserveringen.push(...reserveringenVoorVandaag);
    }

    this.reserveringen.set(alleReserveringen);
    this.filterReserveringen();
  }

  async loadLosseVerkoop(): Promise<void> {
    const selectedVoorstelling = this.selectedVoorstelling();
    if (!selectedVoorstelling) {
      this.losseVerkoop.set([]);
      return;
    }

    try {
      const losseVerkoopCollection =
        this.client.directClient.collection('losse_verkoop');
      const alleLosseVerkoop = (await losseVerkoopCollection.getFullList({
        filter: this.client.directClient.filter(
          'voorstelling.id = {:voorstellingId}',
          { voorstellingId: selectedVoorstelling.id }
        ),
      })) as LosseVerkoop[];
      this.losseVerkoop.set(alleLosseVerkoop);
    } catch (error) {
      console.error('Error loading losse verkoop:', error);
    }
  }

  async selectEerstvolgendeVoorstelling(): Promise<void> {
    const vandaag = new Date();
    const alleVoorstellingen = this.voorstellingen();

    // Find the first voorstelling where datum_tijd_1 or datum_tijd_2 is in the future
    // Check all dates across all voorstellingen and pick the earliest one
    let eerstvolgendeVoorstelling: Voorstelling | null = null;
    let eerstvolgendeDatum: Date | null = null;
    let geselecteerdeDag: 'datum1' | 'datum2' = 'datum1';

    for (const voorstelling of alleVoorstellingen) {
      // Check datum_tijd_1 if it exists and is in the future
      if (voorstelling.datum_tijd_1) {
        const datum1 = new Date(voorstelling.datum_tijd_1);
        if (datum1 > vandaag) {
          if (!eerstvolgendeDatum || datum1 < eerstvolgendeDatum) {
            eerstvolgendeDatum = datum1;
            eerstvolgendeVoorstelling = voorstelling;
            geselecteerdeDag = 'datum1';
          }
        }
      }

      // Check datum_tijd_2 if it exists and is in the future
      if (voorstelling.datum_tijd_2) {
        const datum2 = new Date(voorstelling.datum_tijd_2);
        if (datum2 > vandaag) {
          if (!eerstvolgendeDatum || datum2 < eerstvolgendeDatum) {
            eerstvolgendeDatum = datum2;
            eerstvolgendeVoorstelling = voorstelling;
            geselecteerdeDag = 'datum2';
          }
        }
      }
    }

    if (!eerstvolgendeVoorstelling || !eerstvolgendeDatum) {
      this.toastr.info('Geen aankomende voorstellingen gevonden');
      return;
    }

    this.selectedVoorstelling.set(eerstvolgendeVoorstelling);
    this.selectedDag.set(geselecteerdeDag);
    this.voorstellingenVoorVandaag.set([eerstvolgendeVoorstelling]);

    // Load reserveringen for this voorstelling and specific dag
    await this.loadReserveringenVoorVoorstelling(
      eerstvolgendeVoorstelling,
      eerstvolgendeDatum,
      geselecteerdeDag
    );

    // Load losse verkoop for selected voorstelling
    await this.loadLosseVerkoop();

    this.toastr.success(
      `Eerstvolgende voorstelling geselecteerd: ${
        eerstvolgendeVoorstelling.titel
      } (${geselecteerdeDag === 'datum1' ? 'datum 1' : 'datum 2'})`
    );
  }

  async loadReserveringenVoorVoorstelling(
    voorstelling: Voorstelling,
    datum: Date,
    dag: 'datum1' | 'datum2'
  ): Promise<void> {
    this.loading.set(true);

    try {
      // Use typed collection for reserveringen
      const reserveringenCollection =
        this.client.directClient.collection('reserveringen');
      const reserveringen = (await reserveringenCollection.getFullList({
        filter: this.client.directClient.filter(
          'voorstelling.id = {:voorstellingId}',
          {
            voorstellingId: voorstelling.id,
          }
        ),
        expand: 'voorstelling',
      })) as Reservering[];

      // Filter reserveringen for the specific dag only
      const gefilterdeReserveringen = reserveringen.filter((reservering) => {
        // Only show reserveringen that have tickets for the selected dag
        if (dag === 'datum1' && reservering.datum_tijd_1_aantal > 0) {
          return true;
        }
        if (dag === 'datum2' && reservering.datum_tijd_2_aantal > 0) {
          return true;
        }
        return false;
      });

      this.reserveringen.set(gefilterdeReserveringen);
      this.filterReserveringen();
    } catch (error) {
      console.error('Error loading reserveringen:', error);
      this.toastr.error('Fout bij het laden van reserveringen');
    } finally {
      this.loading.set(false);
    }
  }

  filterReserveringen(): void {
    const search = this.searchTerm().toLowerCase().trim();

    if (!search) {
      this.filteredReserveringen.set(this.reserveringen());
      return;
    }

    const filtered = this.reserveringen().filter((reservering) => {
      const voornaam = reservering.voornaam.toLowerCase();
      const achternaam = reservering.achternaam.toLowerCase();
      const email = reservering.email.toLowerCase();
      const naam = `${voornaam} ${achternaam}`.toLowerCase();

      return (
        voornaam.includes(search) ||
        achternaam.includes(search) ||
        email.includes(search) ||
        naam.includes(search)
      );
    });

    this.filteredReserveringen.set(filtered);
  }

  onSearchTermChanged(newValue: string): void {
    this.searchTerm.set(newValue);
  }

  onCheckboxChange(event: { reservering: Reservering; dag: 1 | 2 }): void {
    const { reservering, dag } = event;
    if (dag === 1) {
      reservering.aanwezig_datum_1 = !reservering.aanwezig_datum_1;
    } else {
      reservering.aanwezig_datum_2 = !reservering.aanwezig_datum_2;
    }

    this.client.update<Reservering>('reserveringen', reservering);

    this.reserveringen.update((reserveringen) =>
      reserveringen.map((x) => (x.id === reservering.id ? reservering : x))
    );
    this.filterReserveringen();

    this.toastr.success('Aanwezigheid bijgewerkt');
  }

  async openEditDialog(reservering: Reservering): Promise<void> {
    const dialogData = {
      reservering,
      voorstelling: this.selectedVoorstelling(),
    };

    const dialogRef = this.dialog.open(ReserveringEditDialogComponent, {
      data: dialogData,
      hasBackdrop: true,
    });

    const { updatedReservering } = await lastValueFrom(dialogRef.afterClosed());

    if (updatedReservering) {
      this.reserveringen.update((reserveringen) =>
        reserveringen.map((x) =>
          x.id === updatedReservering.id ? updatedReservering : x
        )
      );
      this.filterReserveringen();

      this.toastr.success('Reservering succesvol aangepast');
    }
  }

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
        this.reserveringen.update((reserveringen) =>
          reserveringen.map((x) =>
            x.id === reservering.id ? updatedReservering : x
          )
        );
        this.filterReserveringen();

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
        this.reserveringen.update((reserveringen) =>
          reserveringen.map((x) =>
            x.id === reservering.id ? updatedReservering : x
          )
        );
        this.filterReserveringen();

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
        this.reserveringen.update((reserveringen) =>
          reserveringen.map((x) =>
            x.id === reservering.id ? updatedReservering : x
          )
        );
        this.filterReserveringen();

        this.toastr.success('Verificatie status bijgewerkt');
      }
    }
  }

  isVoorstellingToday(voorstelling: Voorstelling): boolean {
    return !!(
      (voorstelling.datum_tijd_1 && isDateToday(voorstelling.datum_tijd_1)) ||
      (voorstelling.datum_tijd_2 && isDateToday(voorstelling.datum_tijd_2))
    );
  }

  shouldShowEerstvolgendeButton(): boolean {
    const voorstellingen = this.voorstellingenVoorVandaag();
    // Als er geen voorstellingen zijn, toon de knop
    if (voorstellingen.length === 0) {
      return true;
    }
    // Als er voorstellingen zijn vandaag, verberg de knop
    return !voorstellingen.some((v) => this.isVoorstellingToday(v));
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
      await this.loadLosseVerkoop();
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
    await this.loadLosseVerkoop();

    this.toastr.success('Losse verkoop succesvol verwijderd');
  }

  openInformatieDialog(): void {
    this.dialog.open(InformatieDialogComponent, {
      data: {
        title: 'Hoe werkt De Kassa?',
        content: `
          <div>
            <h4>Overzicht</h4>
            <p>De Kassa pagina toont reserveringen voor vandaag of de eerstvolgende voorstelling.</p>
            
            <h4 class="mt-3">Zoeken</h4>
            <p>Gebruik de zoekbalk om reserveringen te vinden op naam of emailadres.</p>
            
            <h4 class="mt-3">Aanwezigheid registreren</h4>
            <p>Vink het checkboxje aan wanneer bezoekers arriveren om hun aanwezigheid te registreren.</p>
            
            <h4 class="mt-3">Verificatie</h4>
            <p>Klik op het vlaggetje icoon om de verificatiestatus te controleren of aan te passen. Dit helpt bij het controleren of bezoekers lid of vriend van Tovedem zijn.</p>
            
            <h4 class="mt-3">Reservering bewerken</h4>
            <p>Klik op het potlood icoon om reserveringsgegevens te bewerken, zoals naam, email, aantal tickets, of lid/vriend status.</p>
            
            <h4 class="mt-3">Eerstvolgende voorstelling</h4>
            <p>Als er vandaag geen voorstellingen zijn, kunnen beheerders de eerstvolgende voorstelling selecteren met de knop "Selecteer eerstvolgende voorstelling".</p>
          </div>
        `,
      },
      width: '600px',
      maxWidth: '90vw',
      hasBackdrop: true,
    });
  }
}
