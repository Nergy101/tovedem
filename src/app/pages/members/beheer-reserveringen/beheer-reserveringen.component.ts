import {
  Component,
  WritableSignal,
  effect,
  inject,
  signal,
} from '@angular/core';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Reservering from '../../../models/domain/resservering.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, tap } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../../shared/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ReserveringEditDialogComponent } from './reserveringen-edit-dialog/reservering-edit-dialog.component';
import { MatLine } from '@angular/material/core';
import { MatDivider } from '@angular/material/divider';

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
  ],
  templateUrl: './beheer-reserveringen.component.html',
  styleUrl: './beheer-reserveringen.component.scss',
})
export class BeheerReserveringenComponent {
  loading = signal(false);
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
        tap(() => this.loading.set(true)),
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
                'email ~ {:search} || achternaam ~ {:search} || voorstelling.titel ~ {:search}',
                {
                  search: newSearchTerm,
                }
              ),
            })
          );
        }

        this.loading.set(false);
      });
  }

  async ngOnInit(): Promise<void> {
    // this.loading.set(true);
    // this.items.set(
    //   await this.client.getAll<Reservering>('reserveringen', {
    //     expand: 'voorstelling',
    //   })
    // );
    // this.loading.set(false);
  }

  async delete({ id }: any) {
    this.loading.set(true);

    if (await this.client.delete('reserveringen', id)) {
      this.items.update((x) => x!.filter((y: any) => y.id != id));
    }

    this.loading.set(false);
  }

  async openEditDialog(use_reservering : Reservering) {
    const dialogRef = this.dialog.open(ReserveringEditDialogComponent, {
      data: { existingVoorstelling: use_reservering },
      hasBackdrop: true,
    });}

  onSearchTermChanged(newValue: string) {
    this.searchTerm.set(newValue);
  }
}
