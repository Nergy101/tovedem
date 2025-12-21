import { AmsterdamDatePipe } from '../../../shared/pipes/amsterdam-date.pipe';
import {
  Component,
  OnInit,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import { Nieuws } from '../../../models/domain/nieuws.model';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { ErrorService } from '../../../shared/services/error.service';
import { NieuwsCreateEditDialogComponent } from './nieuws-create-edit-dialog/nieuws-create-edit-dialog.component';
import { NieuwsImageDialogComponent } from './nieuws-image-dialog/nieuws-image-dialog.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-beheer-nieuws',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AmsterdamDatePipe,
    MatDatepickerModule,
    MatCardModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
  ],
  templateUrl: './beheer-nieuws.component.html',
  styleUrl: './beheer-nieuws.component.scss',
})
export class BeheerNieuwsComponent implements OnInit {
  loading = signal(false);

  allItems: WritableSignal<Nieuws[] | null> = signal(null);

  client = inject(PocketbaseService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);
  errorService = inject(ErrorService);
  titleService = inject(Title);

  actieveItems = computed(() => {
    const items = this.allItems();
    if (!items) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return items
      .filter((item) => {
        const publishDate = item.publishDate
          ? new Date(item.publishDate)
          : null;
        const archiveDate = item.archiveDate
          ? new Date(item.archiveDate)
          : null;

        if (!publishDate) return false;

        const publishDateNormalized = new Date(publishDate);
        publishDateNormalized.setHours(0, 0, 0, 0);

        if (publishDateNormalized > today) return false;

        if (archiveDate) {
          const archiveDateNormalized = new Date(archiveDate);
          archiveDateNormalized.setHours(0, 0, 0, 0);
          return archiveDateNormalized > today;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = a.publishDate ? new Date(a.publishDate).getTime() : 0;
        const dateB = b.publishDate ? new Date(b.publishDate).getTime() : 0;
        return dateB - dateA; // Descending (newest first)
      });
  });

  toekomstigEnGearchiveerdItems = computed(() => {
    const items = this.allItems();
    if (!items) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toekomstig: Nieuws[] = [];
    const gearchiveerd: Nieuws[] = [];

    items.forEach((item) => {
      const publishDate = item.publishDate ? new Date(item.publishDate) : null;
      const archiveDate = item.archiveDate ? new Date(item.archiveDate) : null;

      if (publishDate) {
        const publishDateNormalized = new Date(publishDate);
        publishDateNormalized.setHours(0, 0, 0, 0);

        if (publishDateNormalized > today) {
          toekomstig.push(item);
          return;
        }
      }

      if (archiveDate) {
        const archiveDateNormalized = new Date(archiveDate);
        archiveDateNormalized.setHours(0, 0, 0, 0);

        if (archiveDateNormalized <= today) {
          gearchiveerd.push(item);
          return;
        }
      }
    });

    // Sort gearchiveerd: ascending on archiveDate
    gearchiveerd.sort((a, b) => {
      const dateA = a.archiveDate
        ? new Date(a.archiveDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      const dateB = b.archiveDate
        ? new Date(b.archiveDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });

    // Sort toekomstig: ascending on publishDate
    toekomstig.sort((a, b) => {
      const dateA = a.publishDate
        ? new Date(a.publishDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      const dateB = b.publishDate
        ? new Date(b.publishDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });

    // Return: first gearchiveerd, then toekomstig
    return [...gearchiveerd, ...toekomstig];
  });

  constructor() {
    this.titleService.setTitle('Tovedem - Beheer - Nieuws');
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      this.allItems.set(
        await this.client.directClient.collection('nieuws').getFullList({
          sort: '-created',
        })
      );
    } finally {
      this.loading.set(false);
    }
  }

  async openCreateDialog(): Promise<void> {
    const dialogRef = this.dialog.open(NieuwsCreateEditDialogComponent, {
      data: { existingNieuws: null },
      hasBackdrop: true,
      minWidth: '90vw',
    });

    const created: Nieuws = await lastValueFrom(dialogRef.afterClosed());

    if (created) {
      this.toastr.success(`Nieuwsbericht ${created.titel} aangemaakt.`);
      await this.ngOnInit();
    }
  }

  async openEditDialog(nieuws: Nieuws): Promise<void> {
    const dialogRef = this.dialog.open(NieuwsCreateEditDialogComponent, {
      data: { existingNieuws: nieuws },
      hasBackdrop: true,
      minWidth: '90vw',
    });

    const updated: Nieuws = await lastValueFrom(dialogRef.afterClosed());

    if (updated) {
      this.toastr.success(`Nieuwsbericht ${updated.titel} aangepast.`);
      await this.ngOnInit();
    }
  }

  async delete(id: string): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Nieuwsbericht verwijderen',
        message: 'Weet je zeker dat je het nieuwsbericht wilt verwijderen?',
      },
    });

    const dialogResult = await lastValueFrom(dialogRef.afterClosed());

    if (!dialogResult) return;

    this.loading.set(true);

    try {
      await this.client.delete('nieuws', id);
      this.allItems.update((x) => x!.filter((y: Nieuws) => y.id != id));
      this.toastr.success('Nieuwsbericht succesvol verwijderd', 'Gelukt!');
    } catch (error: unknown) {
      const errorMessage = this.errorService.getErrorMessage(
        error,
        'Nieuwsbericht verwijderen'
      );
      this.toastr.error(errorMessage, 'Fout bij verwijderen', {
        positionClass: 'toast-bottom-right',
        timeOut: 7000,
      });
    } finally {
      this.loading.set(false);
    }
  }

  async openImageDialog(nieuws: Nieuws): Promise<void> {
    this.dialog.open(NieuwsImageDialogComponent, {
      data: {
        nieuws: nieuws,
      },
      hasBackdrop: true,
    });
  }

  isActief(nieuws: Nieuws): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const publishDate = nieuws.publishDate ? new Date(nieuws.publishDate) : null;
    const archiveDate = nieuws.archiveDate ? new Date(nieuws.archiveDate) : null;

    if (!publishDate) return false;

    const publishDateNormalized = new Date(publishDate);
    publishDateNormalized.setHours(0, 0, 0, 0);

    if (publishDateNormalized > today) return false;

    if (archiveDate) {
      const archiveDateNormalized = new Date(archiveDate);
      archiveDateNormalized.setHours(0, 0, 0, 0);
      return archiveDateNormalized > today;
    }

    return true;
  }

  isToekomstig(nieuws: Nieuws): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const publishDate = nieuws.publishDate ? new Date(nieuws.publishDate) : null;

    if (!publishDate) return false;

    const publishDateNormalized = new Date(publishDate);
    publishDateNormalized.setHours(0, 0, 0, 0);

    return publishDateNormalized > today;
  }

  isGearchiveerd(nieuws: Nieuws): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const archiveDate = nieuws.archiveDate ? new Date(nieuws.archiveDate) : null;

    if (!archiveDate) return false;

    const archiveDateNormalized = new Date(archiveDate);
    archiveDateNormalized.setHours(0, 0, 0, 0);

    return archiveDateNormalized <= today;
  }
}


