import {
  Component,
  OnInit,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { Reservering } from '../../../models/domain/reservering.model';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { InformatieDialogComponent } from '../../../shared/components/informatie-dialog/informatie-dialog.component';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { ErrorService } from '../../../shared/services/error.service';
import { DateTimeService } from '../../../shared/services/datetime.service';
import { VoorstellingCreateEditDialogComponent } from './voorstelling-create-edit-dialog/voorstelling-create-edit-dialog.component';
import { MatCardModule } from '@angular/material/card';
import { AmsterdamDatePipe } from '../../../shared/pipes/amsterdam-date.pipe';
import { SkeletonGroupComponent } from '../../../shared/components/skeleton/skeleton-group.component';

@Component({
  selector: 'app-beheer-voorstellingen',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    AmsterdamDatePipe,
    MatDatepickerModule,
    NgxMaterialTimepickerModule,
    MatTooltipModule,
    MatCardModule,
    SkeletonGroupComponent,
    MatTabsModule,
    NgTemplateOutlet,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
  ],
  templateUrl: './beheer-voorstellingen.component.html',
  styleUrl: './beheer-voorstellingen.component.scss',
})
export class BeheerVoorstellingenComponent implements OnInit {
  loading = signal(false);

  items: WritableSignal<Voorstelling[] | null> = signal(null);

  actueel = computed(() =>
    (this.items() ?? []).filter((v) => !v.gearchiveerd)
  );

  // Gearchiveerd: nieuwste speeldatum eerst
  gearchiveerd = computed(() =>
    (this.items() ?? [])
      .filter((v) => v.gearchiveerd)
      .sort((a, b) => (b.datum_tijd_1 ?? '').localeCompare(a.datum_tijd_1 ?? ''))
  );

  client = inject(PocketbaseService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);
  themeService = inject(ThemeService);
  errorService = inject(ErrorService);
  dateTimeService = inject(DateTimeService);

  titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('Tovedem - Beheer - Voorstellingen');
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      this.items.set(
        await this.client.directClient
          .collection('voorstellingen')
          .getFullList({
            expand: 'groep,spelers',
            sort: '-created',
          })
      );
    } finally {
      this.loading.set(false);
    }
  }

  async openCreateDialog(): Promise<void> {
    const dialogRef = this.dialog.open(VoorstellingCreateEditDialogComponent, {
      data: { existingVoorstelling: null },
      hasBackdrop: true,
      minWidth: '60vw',
      maxWidth: '70vw',
    });

    const created: Voorstelling = await lastValueFrom(dialogRef.afterClosed());

    if (created) {
      this.toastr.success(`Voorstelling ${created.titel} aangemaakt.`);
      await this.ngOnInit();
    }
  }

  async openEditDialog(use_voorstelling: Voorstelling): Promise<void> {
    const dialogRef = this.dialog.open(VoorstellingCreateEditDialogComponent, {
      data: { existingVoorstelling: use_voorstelling },
      hasBackdrop: true,
      minWidth: '60vw',
      maxWidth: '70vw',
    });

    const updated: Voorstelling = await lastValueFrom(dialogRef.afterClosed());

    if (updated) {
      this.toastr.success(`Voorstelling ${updated.titel} aangepast.`);
      await this.ngOnInit();
    }
  }

  async delete(id: string): Promise<void> {
    // Check if there are related reserveringen before attempting deletion
    this.loading.set(true);
    let hasReserveringen = false;
    let reserveringenCount = 0;

    try {
      const reserveringen = await this.client.directClient
        .collection('reserveringen')
        .getFullList<Reservering>({
          filter: this.client.directClient.filter(
            'voorstelling = {:voorstellingId}',
            {
              voorstellingId: id,
            }
          ),
        });

      reserveringenCount = reserveringen.length;
      hasReserveringen = reserveringenCount > 0;
    } catch (error) {
      console.error('Error checking for related reserveringen:', error);
      // Continue with deletion attempt even if check fails
    } finally {
      this.loading.set(false);
    }

    // If there are reserveringen, show information dialog with archive option
    if (hasReserveringen) {
      const dialogRef = this.dialog.open(InformatieDialogComponent, {
        data: {
          title: 'Kan niet verwijderen',
          content:
            `Deze voorstelling heeft <strong>${reserveringenCount}</strong> gerelateerde reservering(en). ` +
            `De voorstelling kan niet worden verwijderd zolang er reserveringen zijn.<br><br>` +
            `U kunt de voorstelling wel archiveren, waardoor deze verborgen wordt maar de reserveringen behouden blijven.`,
          showArchiveButton: true,
        },
      });

      const dialogResult = await lastValueFrom(dialogRef.afterClosed());

      // Handle archive action
      if (dialogResult === 'archive') {
        await this.zetArchief(id, true);
      }
      return;
    }

    // Show confirmation dialog for deletion with archive option
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Voorstelling verwijderen',
        message: 'Weet je zeker dat je de voorstelling wilt verwijderen?',
        showArchiveButton: true,
      },
    });

    const dialogResult = await lastValueFrom(dialogRef.afterClosed());

    if (!dialogResult) return;

    // Handle archive action
    if (dialogResult === 'archive') {
      await this.zetArchief(id, true);
      return;
    }

    // Handle delete action
    this.loading.set(true);

    try {
      await this.client.delete('voorstellingen', id);
      this.items.update((x) => x!.filter((y: { id: string }) => y.id != id));
      this.toastr.success('Voorstelling succesvol verwijderd', 'Gelukt!');
    } catch (error: unknown) {
      const errorMessage = this.errorService.getErrorMessage(
        error,
        'Voorstelling verwijderen'
      );
      this.toastr.error(errorMessage, 'Fout bij verwijderen', {
        positionClass: 'toast-bottom-right',
        timeOut: 7000,
      });
    } finally {
      this.loading.set(false);
    }
  }

  async archiveer(item: Voorstelling): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Voorstelling archiveren',
        message: `Weet je zeker dat je "${item.titel}" wilt archiveren? De voorstelling is dan niet meer zichtbaar op de openbare pagina's. De foto's blijven in de galerij.`,
      },
    });
    if (!(await lastValueFrom(dialogRef.afterClosed()))) return;

    await this.zetArchief(item.id, true);
  }

  async terugzetten(item: Voorstelling): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Voorstelling terugzetten',
        message: `"${item.titel}" wordt weer zichtbaar op de openbare pagina's en wordt daarna niet meer automatisch gearchiveerd.`,
      },
    });
    if (!(await lastValueFrom(dialogRef.afterClosed()))) return;

    await this.zetArchief(item.id, false);
  }

  /**
   * Archiveren of terugzetten. Handmatig terugzetten zet niet_auto_archiveren,
   * zodat de nachtelijke automatische archivering de voorstelling laat staan.
   */
  private async zetArchief(id: string, gearchiveerd: boolean): Promise<void> {
    const actie = gearchiveerd ? 'archiveren' : 'terugzetten';
    this.loading.set(true);
    try {
      const voorstelling = await this.client.getOne<Voorstelling>(
        'voorstellingen',
        id
      );
      await this.client.update<Voorstelling>('voorstellingen', {
        ...voorstelling,
        gearchiveerd,
        niet_auto_archiveren: !gearchiveerd,
      });
      this.items.update((x) =>
        x!.map((y) =>
          y.id === id
            ? { ...y, gearchiveerd, niet_auto_archiveren: !gearchiveerd }
            : y
        )
      );
      this.toastr.success(
        gearchiveerd
          ? 'Voorstelling succesvol gearchiveerd'
          : 'Voorstelling teruggezet naar actueel',
        'Gelukt!'
      );
    } catch (error: unknown) {
      const errorMessage = this.errorService.getErrorMessage(
        error,
        `Voorstelling ${actie}`
      );
      this.toastr.error(errorMessage, `Fout bij ${actie}`, {
        positionClass: 'toast-bottom-right',
        timeOut: 7000,
      });
    } finally {
      this.loading.set(false);
    }
  }

  publicatieActief(publishDateString: string): boolean {
    // Use timezone-aware comparison
    return !this.dateTimeService.isPast(publishDateString);
  }

  getPrimaryTintColor(): string {
    // Primary blue (#7db3e8) with 0.3 opacity for consistency with 'nieuw' status
    return 'rgba(125, 179, 232, 0.3)';
  }
}
