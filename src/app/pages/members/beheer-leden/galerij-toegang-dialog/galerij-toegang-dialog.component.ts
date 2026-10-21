import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { Gebruiker } from '../../../../models/domain/gebruiker.model';
import { Groep } from '../../../../models/domain/groep.model';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { ErrorService } from '../../../../shared/services/error.service';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';

type VoorstellingMetGroep = Voorstelling & { expand?: { groep?: Groep } };
type Sortering = 'datum' | 'groep';

@Component({
  selector: 'app-galerij-toegang-dialog',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './galerij-toegang-dialog.component.html',
  styleUrl: './galerij-toegang-dialog.component.scss',
})
export class GalerijToegangDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<GalerijToegangDialogComponent>);
  private client = inject(PocketbaseService);
  private toastr = inject(ToastrService);
  private errorService = inject(ErrorService);
  gebruiker: Gebruiker = inject(MAT_DIALOG_DATA);

  loading = signal(true);
  saving = signal(false);
  voorstellingen = signal<VoorstellingMetGroep[]>([]);
  geselecteerd = signal<Set<string>>(
    new Set(this.gebruiker.galerij_voorstellingen ?? [])
  );
  groepFilter = signal<string>('alle');
  sortering = signal<Sortering>('datum');

  groepen = computed(() => {
    const namen = this.voorstellingen()
      .map((v) => v.expand?.groep?.naam)
      .filter((naam): naam is string => !!naam);
    return [...new Set(namen)].sort();
  });

  // Voorstellingen komen al van nieuw naar oud binnen; bij groep-sortering
  // blijft die volgorde binnen elke groep behouden (stabiele sort).
  zichtbareVoorstellingen = computed(() => {
    const filter = this.groepFilter();
    const lijst = this.voorstellingen().filter(
      (v) => filter === 'alle' || v.expand?.groep?.naam === filter
    );
    if (this.sortering() === 'groep') {
      return [...lijst].sort((a, b) =>
        (a.expand?.groep?.naam ?? '').localeCompare(b.expand?.groep?.naam ?? '')
      );
    }
    return lijst;
  });

  aantalGeselecteerd = computed(() => this.geselecteerd().size);

  async ngOnInit(): Promise<void> {
    try {
      this.voorstellingen.set(
        await this.client.directClient
          .collection('voorstellingen')
          .getFullList<VoorstellingMetGroep>({
            expand: 'groep',
            sort: '-datum_tijd_1',
          })
      );
    } catch (error) {
      this.toastr.error(
        this.errorService.getErrorMessage(error, 'Voorstellingen laden'),
        'Fout'
      );
    } finally {
      this.loading.set(false);
    }
  }

  isGeselecteerd(id: string): boolean {
    return this.geselecteerd().has(id);
  }

  toggle(id: string, checked: boolean): void {
    this.geselecteerd.update((set) => {
      const next = new Set(set);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  async opslaan(): Promise<void> {
    this.saving.set(true);
    try {
      const updated = await this.client.directClient
        .collection('users')
        .update<Gebruiker>(this.gebruiker.id, {
          galerij_voorstellingen: [...this.geselecteerd()],
        });
      this.dialogRef.close(updated);
    } catch (error) {
      this.toastr.error(
        this.errorService.getErrorMessage(error, 'Galerij toegang opslaan'),
        'Fout'
      );
    } finally {
      this.saving.set(false);
    }
  }
}
