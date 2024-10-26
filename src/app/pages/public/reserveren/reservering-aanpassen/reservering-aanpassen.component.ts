import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import Reservering from '../../../../models/domain/resservering.model';

@Component({
  selector: 'app-reservering-aanpassen',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,],
  templateUrl: './reservering-aanpassen.component.html',
  styleUrl: './reservering-aanpassen.component.scss'
})
export class ReserveringAanpassenComponent {

  router = inject(Router);
  route = inject(ActivatedRoute);
  reserveringId = signal<string | undefined>(undefined);
  reserveringGuid = signal<string | undefined>(undefined);
  reservering = signal<any | undefined>(undefined);
  client = inject(PocketbaseService);

  constructor() {
    this.route.params
      .pipe(tap(
        params => {
          console.log(params.id);
          this.reserveringId.set(params.id);
          this.reserveringGuid.set(params.guid);
        }
      ),
        takeUntilDestroyed())
      .subscribe()


    effect(async () => {
      if (!this.reserveringId()) return;
      const reservering = await this.client.getOne<Reservering>('reserveringen', this.reserveringId()!,
        {
          expand: 'voorstelling.groep'
        });

      if (this.reserveringGuid() !== reservering.guid) {
        this.router.navigate(['/']);
      }

      this.reservering.set(reservering);
    })

    effect(() => {
      if (!this.reservering()) return;
      console.log(this.reservering());
    })

  }

}
