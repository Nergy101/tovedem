import {
  Component,
  WritableSignal,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatLine } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Title } from '@angular/platform-browser';
import { debounceTime, lastValueFrom, tap } from 'rxjs';
import Reservering from '../../../models/domain/resservering.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { ReserveringEditDialogComponent } from './reserveringen-edit-dialog/reservering-edit-dialog.component';

@Component({
  selector: 'app-beheer-reserveringen',
  standalone: true,
  imports: [
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatLine,
    MatDivider,
    MatProgressBarModule,
  ],
  templateUrl: './beheer-reserveringen.component.html',
  styleUrl: './beheer-reserveringen.component.scss',
})
export class BeheerReserveringenComponent {
  loading = signal(false);
  searching = signal(false)
  items: WritableSignal<any[] | null> = signal(null);
  client = inject(PocketbaseService);
  searchTerm = signal('');
  searchTerm$ = toObservable(this.searchTerm);
  dialog = inject(MatDialog);
  authService = inject(AuthService);
  titleService = inject(Title);

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
            await this.client.getAll<Reservering>('reserveringen', {
              expand: 'voorstelling',
            })
          );
        } else {
          this.items.set(
            await this.client.getAll<Reservering>('reserveringen', {
              expand: 'voorstelling',
              filter: this.client.client.filter(
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

  async delete({ id }: any) {
    this.loading.set(true);

    if (await this.client.delete('reserveringen', id)) {
      this.items.update((x) => x!.filter((y: any) => y.id != id));
    }

    this.loading.set(false);
  }

  async openEditDialog(reservering: Reservering) {
    const dialogRef = this.dialog.open(ReserveringEditDialogComponent, {
      data: { reservering },
      hasBackdrop: true,
    });

    await lastValueFrom(dialogRef.afterClosed());
    this.items.set(
      await this.client.getAll<Reservering>('reserveringen', {
        expand: 'voorstelling',
      })
    );
  }

  onSearchTermChanged(newValue: string) {
    this.searchTerm.set(newValue);
  }
}
