import { Component, WritableSignal, inject, signal } from '@angular/core';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-beheer-voorstellingen',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSelectModule, MatMenuModule],
  templateUrl: './beheer-voorstellingen.component.html',
  styleUrl: './beheer-voorstellingen.component.scss',
})
export class BeheerVoorstellingenComponent {
  loading = signal(false);

  items: WritableSignal<any[] | null> = signal(null);

  client = inject(PocketbaseService).client;

  displayedColumns = ['id', 'naam', 'actions'];

  async ngOnInit(): Promise<void> {
    const items = (
      await this.client
        .collection('voorstellingen')
        .getList(0, 30, { expand: 'groep,spelers' })
    ).items as any[];

    console.log(items);
    this.items.set(items);
  }

  async delete(element: any) {
    this.loading.set(true);
    await this.client.collection('voorstellingen').delete(element.id);

    this.items.update((x) => x!.filter((y: any) => y.id != element.id));
    this.loading.set(false);
  }
}
