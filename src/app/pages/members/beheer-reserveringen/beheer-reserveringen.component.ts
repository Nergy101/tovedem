import { Component, WritableSignal, inject, signal } from '@angular/core';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Reservering from '../../../models/domain/resservering.model';

@Component({
  selector: 'app-beheer-reserveringen',
  standalone: true,
  imports: [
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './beheer-reserveringen.component.html',
  styleUrl: './beheer-reserveringen.component.scss',
})
export class BeheerReserveringenComponent {
  loading = signal(false);

  items: WritableSignal<any[] | null> = signal(null);

  client = inject(PocketbaseService);

  async ngOnInit(): Promise<void> {
    this.items.set(
      await this.client.getAll<Reservering>('reserveringen', {
        expand: 'voorstelling',
      })
    );
  }

  async delete({ id }: any) {
    this.loading.set(true);

    if (await this.client.delete('reserveringen', id)) {
      this.items.update((x) => x!.filter((y: any) => y.id != id));
    }

    this.loading.set(false);
  }
}
