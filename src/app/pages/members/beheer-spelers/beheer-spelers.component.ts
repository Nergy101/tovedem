import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';

import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Speler } from '../../../models/domain/speler.model';
import { BeheerSpelersUpdateDialogComponent } from './beheer-spelers-update-dialog/beheer-spelers-update-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { Title } from '@angular/platform-browser';

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
    styleUrl: './beheer-spelers.component.scss'
})
export class BeheerSpelersComponent implements OnInit {
  loading = signal(false);

  dialog = inject(MatDialog);
  toastr = inject(ToastrService);

  spelers: WritableSignal<Speler[] | null> = signal(null);

  spelerNaam?: string;

  client = inject(PocketbaseService);
  authService = inject(AuthService);

  titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('Tovedem - Beheer - Spelers');
  }

  async ngOnInit(): Promise<void> {
    this.spelers.set(await this.client.getAll<Speler>('spelers'));
  }

  async createSpeler() {
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

  async updateSpeler(spelerOmAanTePassen: Speler) {
    this.loading.set(true);

    const dialogRef = this.dialog.open(BeheerSpelersUpdateDialogComponent, {
      data: spelerOmAanTePassen,
    });

    const updatedSpeler: Speler = await lastValueFrom(dialogRef.afterClosed());

    if (!!updatedSpeler) {
      await this.client.update<Speler>('spelers', updatedSpeler);
      this.toastr.success(`Speler aangepast.`);
    }
    this.loading.set(false);
  }

  async delete({ id }: any) {
    this.loading.set(true);

    if (await this.client.delete('spelers', id)) {
      this.spelers.update((x) => (x ?? []).filter((y: any) => y.id != id));
    }

    this.loading.set(false);
  }
}
