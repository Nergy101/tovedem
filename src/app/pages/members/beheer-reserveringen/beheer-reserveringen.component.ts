import {
  Component,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { debounceTime, tap } from 'rxjs';
import { Reservering } from '../../../models/domain/reservering.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { ReserveringenInzienComponent } from './reserveringen-inzien/reserveringen-inzien.component';

@Component({
  selector: 'app-beheer-reserveringen',
  imports: [
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatMenuModule,
    ReserveringenInzienComponent,
  ],
  templateUrl: './beheer-reserveringen.component.html',
  styleUrl: './beheer-reserveringen.component.scss',
})
export class BeheerReserveringenComponent {
  loading = signal(false);
  searching = signal(false);
  items: WritableSignal<Reservering[] | null> = signal(null);
  client = inject(PocketbaseService);
  searchTerm = signal('');
  searchTerm$ = toObservable(this.searchTerm);
  dialog = inject(MatDialog);

  authService = inject(AuthService);
  titleService = inject(Title);
  range = Array.from({ length: 5 }, (_, i) => i); // Creates [0, 1, 2, 3, 4]

  constructor() {
    this.titleService.setTitle('Tovedem - Beheer - Reserveringen');
    this.searchTerm$
      .pipe(
        tap(() => this.searching.set(true)),
        debounceTime(500),
        takeUntilDestroyed()
      )
      .subscribe(async (newSearchTerm: string) => {
        if (!newSearchTerm || newSearchTerm == '') {
          this.items.set(
            await this.client.directClient.collection('reserveringen').getFullList({
              expand: 'voorstelling',
            })
          );
        } else {
          this.items.set(
            await this.client.directClient.collection('reserveringen').getFullList({
              expand: 'voorstelling',
              filter: this.client.directClient.filter(
                'email ~ {:search} || voornaam ~ {:search} || achternaam ~ {:search} || voorstelling.titel ~ {:search}',
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

  onSearchTermChanged(newValue: string): void {
    this.searchTerm.set(newValue);
  }
}
