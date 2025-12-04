import { CommonModule, DatePipe } from '@angular/common';
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
import { MatSelectModule } from '@angular/material/select';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom, debounceTime, tap } from 'rxjs';
import { Lid } from '../../../models/domain/lid.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { ThemeService } from '../../../shared/services/theme.service';
import { BerichtViewDialogComponent } from './bericht-view-dialog/bericht-view-dialog.component';

@Component({
  selector: 'app-beheer-nieuwe-leden',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './beheer-nieuwe-leden.component.html',
  styleUrl: './beheer-nieuwe-leden.component.scss',
})
export class BeheerNieuweLedenComponent implements OnInit {
  loading = signal(false);
  leden: WritableSignal<Lid[] | null> = signal(null);

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
    this.titleService.setTitle('Tovedem - Beheer - Nieuwe Leden');

    this.searchTerm$
      .pipe(
        tap(() => this.searching.set(true)),
        debounceTime(500),
        takeUntilDestroyed()
      )
      .subscribe(async (newSearchTerm: string) => {
        await this.loadLeden(newSearchTerm);
        this.searching.set(false);
      });
  }

  async ngOnInit(): Promise<void> {
    await this.loadLeden();
  }

  private async loadLeden(searchTerm?: string): Promise<void> {
    try {
      let loadedLeden: Lid[];
      if (!searchTerm || searchTerm === '') {
        loadedLeden = await this.client.directClient.collection('leden').getFullList({
          expand: 'groep',
          sort: '-created',
        });
      } else {
        loadedLeden = await this.client.directClient.collection('leden').getFullList({
          expand: 'groep',
          sort: '-created',
          filter: this.client.directClient.filter(
            'voornaam ~ {:search} || achternaam ~ {:search} || email ~ {:search}',
            {
              search: searchTerm,
            }
          ),
        });
      }
      
      // Ensure each lid has a status
      loadedLeden = loadedLeden.map(lid => ({
        ...lid,
        status: lid.status || 'nieuw'
      }));
      
      this.leden.set(loadedLeden);
    } catch (error) {
      console.error('Error loading leden:', error);
      this.toastr.error('Fout bij het laden van nieuwe ledenaanmeldingen');
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
      if (await this.client.delete('leden', id)) {
        this.leden.update((x) => x!.filter((y: Lid) => y.id != id));
        this.toastr.success('Aanmelding verwijderd.');
      }
    } catch (error) {
      console.error('Error deleting lid:', error);
      this.toastr.error('Fout bij het verwijderen van aanmelding');
    } finally {
      this.loading.set(false);
    }
  }

  getPrimaryTintColor(): string {
    return 'rgba(125, 179, 232, 0.3)';
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

  openBerichtDialog(lid: Lid): void {
    this.dialog.open(BerichtViewDialogComponent, {
      data: {
        bericht: lid.bericht,
        naam: lid.voornaam + ' ' + lid.achternaam,
        voornaam: lid.voornaam,
        achternaam: lid.achternaam,
        geboortedatum: lid.geboorte_datum,
        groep: lid.expand?.groep?.naam,
      },
      width: '600px',
      maxWidth: '90vw',
    });
  }

  getStatus(lid: Lid): 'nieuw' | 'geverifieerd' | 'gekoppeld' {
    return lid.status || 'nieuw';
  }

  async updateStatus(lid: Lid, newStatus: 'nieuw' | 'geverifieerd' | 'gekoppeld'): Promise<void> {
    if (lid.status === newStatus) {
      return; // No change needed
    }

    try {
      await this.client.directClient.collection('leden').update(lid.id, {
        status: newStatus,
      });

      // Update local state
      this.leden.update((leden) =>
        leden!.map((l) => 
          l.id === lid.id ? { ...l, status: newStatus } : l
        )
      );

      this.toastr.success(`Status bijgewerkt naar "${newStatus}"`);
    } catch (error) {
      console.error('Error updating status:', error);
      this.toastr.error('Fout bij het bijwerken van de status');
    }
  }
}
