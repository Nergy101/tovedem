import { DatePipe } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  OnInit,
  WritableSignal,
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
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { VoorstellingCreateEditDialogComponent } from './voorstelling-create-edit-dialog/voorstelling-create-edit-dialog.component';

@Component({
  selector: 'app-beheer-voorstellingen',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    DatePipe,
    MatDatepickerModule,
    NgxMaterialTimepickerModule,
    MatTooltipModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    DatePipe,
    { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
  ],
  templateUrl: './beheer-voorstellingen.component.html',
  styleUrl: './beheer-voorstellingen.component.scss',
})
export class BeheerVoorstellingenComponent implements OnInit, AfterViewChecked {
  loading = signal(false);

  items: WritableSignal<Voorstelling[] | null> = signal(null);

  client = inject(PocketbaseService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);
  themeService = inject(ThemeService);

  titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('Tovedem - Beheer - Voorstellingen');
  }

  async ngOnInit(): Promise<void> {
    this.items.set(
      await this.client.getAll<Voorstelling>('voorstellingen', {
        expand: 'groep,spelers',
        sort: '-created',
      })
    );
  }

  ngAfterViewChecked(): void {
    const isDarkTheme = this.themeService.isDarkTheme$();

    const tables = document.getElementsByTagName('table');

    if (isDarkTheme) {
      tables[0]?.classList.add('table-dark');
    } else {
      tables[0]?.classList.remove('table-dark');
    }
  }

  async openCreateDialog(): Promise<void> {
    const dialogRef = this.dialog.open(VoorstellingCreateEditDialogComponent, {
      data: { existingVoorstelling: null },
      hasBackdrop: true,
      minWidth: '90vw',
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
      minWidth: '90vw',
    });

    const updated: Voorstelling = await lastValueFrom(dialogRef.afterClosed());

    if (updated) {
      this.toastr.success(`Voorstelling ${updated.titel} aangepast.`);
      await this.ngOnInit();
    }
  }

  async delete(id: string): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Voorstelling verwijderen',
        message: 'Weet je zeker dat je de voorstelling wilt verwijderen?',
      },
    });

    const dialogResult = await lastValueFrom(dialogRef.afterClosed());

    if (!dialogResult) return;

    this.loading.set(true);

    if (await this.client.delete('voorstellingen', id)) {
      this.items.update((x) => x!.filter((y: { id: string }) => y.id != id));
    }

    this.loading.set(false);
  }

  publicatieActief(publishDateString: string): boolean {
    const publishDate = new Date(publishDateString);
    const currentDate = new Date();

    return currentDate.setHours(0, 0, 0, 0) < publishDate.setHours(0, 0, 0, 0);
  }
}
