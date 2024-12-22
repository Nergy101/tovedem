import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
  AfterViewChecked,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import { Speler } from '../../../models/domain/speler.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { BeheerSpelersUpdateDialogComponent } from './beheer-spelers-update-dialog/beheer-spelers-update-dialog.component';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { ThemeService } from '../../../shared/services/theme.service';

@Component({
  selector: 'app-beheer-spelers',
  imports: [
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './beheer-spelers.component.html',
  styleUrl: './beheer-spelers.component.scss',
})
export class BeheerSpelersComponent implements OnInit, AfterViewChecked {
  loading = signal(false);

  dialog = inject(MatDialog);
  toastr = inject(ToastrService);

  spelers: WritableSignal<Speler[] | null> = signal(null);

  spelerNaam?: string;

  client = inject(PocketbaseService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('Tovedem - Beheer - Spelers');
  }

  async ngOnInit(): Promise<void> {
    this.spelers.set(await this.client.getAll<Speler>('spelers'));
  }

  ngAfterViewChecked(): void {
    const isDarkTheme = this.themeService.isDarkTheme$();

    const tables = document.getElementsByTagName('table');
    console.log(tables);

    if (isDarkTheme) {
      tables[0]?.classList.add('table-dark');
    } else {
      tables[0]?.classList.remove('table-dark');
    }
  }

  async createSpeler(): Promise<void> {
    this.loading.set(true);

    const nieuweSpeler = await this.client.create<Speler>('spelers', {
      naam: this.spelerNaam,
    });

    this.spelers.update((bestaandeSpelers) => [
      ...(bestaandeSpelers ?? []),
      nieuweSpeler,
    ]);

    this.spelerNaam = '';
    this.loading.set(false);
  }

  async updateSpeler(spelerOmAanTePassen: Speler): Promise<void> {
    this.loading.set(true);

    const dialogRef = this.dialog.open(BeheerSpelersUpdateDialogComponent, {
      data: spelerOmAanTePassen,
    });

    const updatedSpeler: Speler = await lastValueFrom(dialogRef.afterClosed());

    if (updatedSpeler) {
      await this.client.update<Speler>('spelers', updatedSpeler);
      this.toastr.success(`Speler aangepast.`);
    }
    this.loading.set(false);
  }

  async delete(id: string): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Speler verwijderen',
        message: 'Weet je zeker dat je de speler wilt verwijderen?',
      },
    });

    const dialogResult = await lastValueFrom(dialogRef.afterClosed());

    if (!dialogResult) return;

    this.loading.set(true);

    if (await this.client.delete('spelers', id)) {
      this.spelers.update((x) =>
        (x ?? []).filter((y: { id: string }) => y.id != id)
      );
    }

    this.loading.set(false);
  }
}
