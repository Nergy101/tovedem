import { Component, WritableSignal, inject, signal } from '@angular/core';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-beheer-reserveringen',
  standalone: true,
  imports: [MatCheckboxModule, MatIconModule, MatButtonModule],
  templateUrl: './beheer-reserveringen.component.html',
  styleUrl: './beheer-reserveringen.component.scss',
})
export class BeheerReserveringenComponent {
  loading = signal(false);

  items: WritableSignal<any[] | null> = signal(null);

  client = inject(PocketbaseService).client;

  displayedColumns = ['id', 'naam', 'actions'];

  async ngOnInit(): Promise<void> {
    const items = (await this.client
      .collection('reserveringen')
      .getFullList({ expand: 'voorstelling' })) as any[];

    this.items.set(items);
  }

  async delete(element: any) {
    this.loading.set(true);
    await this.client.collection('reserveringen').delete(element.id);

    this.items.update((x) => x!.filter((y: any) => y.id != element.id));
    this.loading.set(false);
  }
}
