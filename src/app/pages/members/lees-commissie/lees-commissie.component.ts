import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import {
  Doelgroep,
  GelezenStuk,
  LeesAdvies,
} from '../../../models/domain/gelezen-stuk.model';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonGroupComponent } from '../../../shared/components/skeleton/skeleton-group.component';
import { SterrenBeoordelingComponent } from '../../../shared/components/sterren-beoordeling/sterren-beoordeling.component';
import { AmsterdamDatePipe } from '../../../shared/pipes/amsterdam-date.pipe';
import { AuthService } from '../../../shared/services/auth.service';
import {
  DOELGROEPEN,
  GelezenStukDialogComponent,
  GelezenStukDialogData,
} from './gelezen-stuk-dialog/gelezen-stuk-dialog.component';
import {
  GelezenStukInvoer,
  LeesCommissieService,
} from './lees-commissie.service';

type SpelersFilter = 'alle' | 'klein' | 'middel' | 'groot';
type Sortering = 'nieuwste' | 'sterren' | 'titel' | 'spelers';

export const ADVIES_LABELS: Record<LeesAdvies, { label: string; icon: string }> =
  {
    aanrader: { label: 'Aanrader', icon: 'thumb_up' },
    misschien: { label: 'Misschien', icon: 'help' },
    afrader: { label: 'Afrader', icon: 'thumb_down' },
  };

@Component({
  selector: 'app-lees-commissie',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    AmsterdamDatePipe,
    EmptyStateComponent,
    SkeletonGroupComponent,
    SterrenBeoordelingComponent,
  ],
  templateUrl: './lees-commissie.component.html',
  styleUrl: './lees-commissie.component.scss',
})
export class LeesCommissieComponent implements OnInit {
  leesCommissieService = inject(LeesCommissieService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);
  titleService = inject(Title);

  adviesLabels = ADVIES_LABELS;
  doelgroepen = DOELGROEPEN;

  loading = signal(true);
  stukken = signal<GelezenStuk[]>([]);

  zoekterm = signal('');
  doelgroepFilter = signal<Doelgroep | 'alle'>('alle');
  spelersFilter = signal<SpelersFilter>('alle');
  adviesFilter = signal<LeesAdvies | 'alle'>('alle');
  sortering = signal<Sortering>('nieuwste');

  gefilterdeStukken = computed(() => {
    const zoek = this.zoekterm().toLowerCase().trim();
    const doelgroep = this.doelgroepFilter();
    const spelers = this.spelersFilter();
    const advies = this.adviesFilter();

    const gefilterd = this.stukken().filter((stuk) => {
      if (
        zoek &&
        !`${stuk.titel} ${stuk.auteur} ${stuk.genre}`
          .toLowerCase()
          .includes(zoek)
      )
        return false;
      if (doelgroep !== 'alle' && !stuk.geschikt_voor.includes(doelgroep))
        return false;
      if (advies !== 'alle' && stuk.advies !== advies) return false;
      if (spelers === 'klein' && stuk.aantal_spelers > 4) return false;
      if (
        spelers === 'middel' &&
        (stuk.aantal_spelers < 5 || stuk.aantal_spelers > 8)
      )
        return false;
      if (spelers === 'groot' && stuk.aantal_spelers < 9) return false;
      return true;
    });

    return [...gefilterd].sort((a, b) => {
      switch (this.sortering()) {
        case 'sterren':
          return b.sterren - a.sterren || a.titel.localeCompare(b.titel);
        case 'titel':
          return a.titel.localeCompare(b.titel);
        case 'spelers':
          return a.aantal_spelers - b.aantal_spelers;
        default:
          return b.gelezen_op.localeCompare(a.gelezen_op);
      }
    });
  });

  heeftFilters = computed(
    () =>
      !!this.zoekterm() ||
      this.doelgroepFilter() !== 'alle' ||
      this.spelersFilter() !== 'alle' ||
      this.adviesFilter() !== 'alle'
  );

  aantalGelezen = computed(() => this.stukken().length);

  gemiddeldeSterren = computed(() => {
    const stukken = this.stukken();
    if (stukken.length === 0) return 0;
    return stukken.reduce((som, s) => som + s.sterren, 0) / stukken.length;
  });

  aantalAanraders = computed(
    () => this.stukken().filter((s) => s.advies === 'aanrader').length
  );

  constructor() {
    this.titleService.setTitle('Tovedem - Lees Commissie');
  }

  async ngOnInit(): Promise<void> {
    await this.laadStukken();
  }

  async laadStukken(): Promise<void> {
    this.loading.set(true);
    try {
      this.stukken.set(await this.leesCommissieService.getAll());
    } catch (error) {
      console.error('Error loading gelezen stukken:', error);
      this.toastr.error('Fout bij het laden van de gelezen stukken');
    } finally {
      this.loading.set(false);
    }
  }

  wisFilters(): void {
    this.zoekterm.set('');
    this.doelgroepFilter.set('alle');
    this.spelersFilter.set('alle');
    this.adviesFilter.set('alle');
  }

  async openStukDialog(stuk?: GelezenStuk): Promise<void> {
    const dialogRef = this.dialog.open<
      GelezenStukDialogComponent,
      GelezenStukDialogData,
      GelezenStukInvoer
    >(GelezenStukDialogComponent, {
      data: {
        stuk,
        lezer: this.authService.userData()?.name ?? '',
      },
      width: '760px',
      maxWidth: '95vw',
      hasBackdrop: true,
    });

    const invoer = await lastValueFrom(dialogRef.afterClosed());
    if (!invoer) return;

    if (stuk) {
      await this.leesCommissieService.update(stuk.id, invoer);
      this.toastr.success(`"${invoer.titel}" is bijgewerkt`);
    } else {
      await this.leesCommissieService.create(invoer);
      this.toastr.success(`"${invoer.titel}" is toegevoegd`);
    }
    await this.laadStukken();
  }

  async verwijderStuk(stuk: GelezenStuk): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Gelezen stuk verwijderen',
        message: `Weet je zeker dat je "${stuk.titel}" wilt verwijderen?`,
      },
    });

    const bevestigd = await lastValueFrom(dialogRef.afterClosed());
    if (!bevestigd) return;

    await this.leesCommissieService.delete(stuk.id);
    await this.laadStukken();
    this.toastr.success('Gelezen stuk verwijderd');
  }

  getDoelgroepLabel(doelgroep: Doelgroep): string {
    return DOELGROEPEN.find((d) => d.waarde === doelgroep)?.label ?? doelgroep;
  }
}
