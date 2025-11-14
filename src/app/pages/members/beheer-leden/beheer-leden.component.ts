import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, lastValueFrom, tap } from 'rxjs';
import { Gebruiker } from '../../../models/domain/gebruiker.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { GebruikerCreateEditDialogComponent } from './gebruiker-create-edit-dialog/gebruiker-create-edit-dialog.component';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { ThemeService } from '../../../shared/services/theme.service';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-beheer-leden',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule,
  ],
  templateUrl: './beheer-leden.component.html',
  styleUrl: './beheer-leden.component.scss',
})
export class BeheerLedenComponent implements OnInit {
  loading = signal(false);

  gebruikers: WritableSignal<Gebruiker[] | null> = signal(null);

  client = inject(PocketbaseService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);
  themeService = inject(ThemeService);
  titleService = inject(Title);

  searching = signal(false);
  searchTerm = signal('');
  searchTerm$ = toObservable(this.searchTerm);

  constructor() {
    this.titleService.setTitle('Tovedem - Beheer - Leden');

    this.searchTerm$
      .pipe(
        tap(() => this.searching.set(true)),
        debounceTime(500),
        takeUntilDestroyed()
      )
      .subscribe(async (newSearchTerm: string) => {
        if (!newSearchTerm || newSearchTerm == '') {
          this.gebruikers.set(
            await this.client.getAll<Gebruiker>('users', {
              expand: 'rollen,groep,speler',
            })
          );
        } else {
          this.gebruikers.set(
            await this.client.getAll<Gebruiker>('users', {
              expand: 'rollen,groep,speler',
              filter: this.client.client.filter(
                'email ~ {:search} || username ~ {:search} || name ~ {:search}',
                {
                  search: newSearchTerm,
                }
              ),
            })
          );
        }

        this.searching.set(false);
      });
  }

  async ngOnInit(): Promise<void> {
    this.gebruikers.set(
      await this.client.getAll<Gebruiker>('users', {
        expand: 'rollen,groep,speler',
      })
    );
  }


  onSearchTermChanged(newValue: string): void {
    this.searchTerm.set(newValue);
  }

  isHuidigeGebruiker(gebruikerId: string): boolean {
    return gebruikerId == this.authService.userData()?.id;
  }

  async openCreateDialog(): Promise<void> {
    const dialogRef = this.dialog.open(GebruikerCreateEditDialogComponent, {
      data: { existingGebruiker: null },
      hasBackdrop: true,
      minWidth: '50vw',
    });

    const created: Gebruiker = await lastValueFrom(dialogRef.afterClosed());

    if (created) {
      this.toastr.success(`Gebruiker ${created.username} aangemaakt.`);
      await this.ngOnInit();
    }
  }

  async openEditDialog(gebruiker: Gebruiker): Promise<void> {
    const dialogRef = this.dialog.open(GebruikerCreateEditDialogComponent, {
      data: { existingGebruiker: gebruiker },
      hasBackdrop: true,
      minWidth: '50vw',
    });

    const edited: Gebruiker = await lastValueFrom(dialogRef.afterClosed());

    if (edited) {
      this.toastr.success(`Gebruiker ${edited.username} aangepast.`);
      await this.ngOnInit();
    }
  }

  async delete(id: string): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Gebruiker verwijderen',
        message: 'Weet je zeker dat je de gebruiker wilt verwijderen?',
      },
    });

    const dialogResult = await lastValueFrom(dialogRef.afterClosed());

    if (!dialogResult) return;

    this.loading.set(true);

    if (await this.client.delete('users', id)) {
      this.gebruikers.update((x) => x!.filter((y: Gebruiker) => y.id != id));
    }

    this.loading.set(false);
  }
}
