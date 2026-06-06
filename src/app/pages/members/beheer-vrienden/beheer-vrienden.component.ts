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
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom, debounceTime, tap } from 'rxjs';
import { VriendVerzoek } from '../../../models/domain/vriend-verzoek.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { ThemeService } from '../../../shared/services/theme.service';
import { BerichtViewDialogComponent } from '../beheer-nieuwe-leden/bericht-view-dialog/bericht-view-dialog.component';

@Component({
  selector: 'app-beheer-vrienden',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './beheer-vrienden.component.html',
  styleUrl: './beheer-vrienden.component.scss',
})
export class BeheerVriendenComponent implements OnInit {
  loading = signal(false);
  verzoeken: WritableSignal<VriendVerzoek[] | null> = signal(null);

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
    this.titleService.setTitle('Tovedem - Beheer - Vrienden van Tovedem');

    this.searchTerm$
      .pipe(
        tap(() => this.searching.set(true)),
        debounceTime(500),
        takeUntilDestroyed()
      )
      .subscribe(async (newSearchTerm: string) => {
        await this.loadVerzoeken(newSearchTerm);
        this.searching.set(false);
      });
  }

  async ngOnInit(): Promise<void> {
    await this.loadVerzoeken();
  }

  private async loadVerzoeken(searchTerm?: string): Promise<void> {
    try {
      let loaded: VriendVerzoek[];
      if (!searchTerm || searchTerm === '') {
        loaded = await this.client.directClient
          .collection('vriend_worden_verzoeken')
          .getFullList({ sort: '-created' });
      } else {
        loaded = await this.client.directClient
          .collection('vriend_worden_verzoeken')
          .getFullList({
            sort: '-created',
            filter: this.client.directClient.filter(
              'name ~ {:search} || email ~ {:search} || subject ~ {:search}',
              { search: searchTerm }
            ),
          });
      }
      this.verzoeken.set(loaded);
    } catch (error) {
      console.error('Error loading vriend verzoeken:', error);
      this.toastr.error('Fout bij het laden van vrienden aanmeldingen');
    }
  }

  onSearchTermChanged(newValue: string): void {
    this.searchTerm.set(newValue);
  }

  async delete(id: string): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Aanmelding verwijderen',
        message: 'Weet je zeker dat je deze aanmelding wilt verwijderen?',
      },
    });

    const dialogResult = await lastValueFrom(dialogRef.afterClosed());
    if (!dialogResult) return;

    this.loading.set(true);
    try {
      if (await this.client.delete('vriend_worden_verzoeken', id)) {
        this.verzoeken.update((x) => x!.filter((v) => v.id !== id));
        this.toastr.success('Aanmelding verwijderd.');
      }
    } catch (error) {
      console.error('Error deleting verzoek:', error);
      this.toastr.error('Fout bij het verwijderen van de aanmelding');
    } finally {
      this.loading.set(false);
    }
  }

  openBerichtDialog(verzoek: VriendVerzoek): void {
    this.dialog.open(BerichtViewDialogComponent, {
      data: {
        bericht: verzoek.message,
        naam: verzoek.name,
      },
      width: '600px',
      maxWidth: '90vw',
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
