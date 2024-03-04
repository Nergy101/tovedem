import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';

import { MatTableModule } from '@angular/material/table';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-beheer-spelers',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './beheer-spelers.component.html',
  styleUrl: './beheer-spelers.component.scss',
})
export class BeheerSpelersComponent implements OnInit {
  spelers: WritableSignal<any | null> = signal(null);

  client = inject(PocketbaseService).client;

  displayedColumns = ['id', 'naam', 'actions'];

  async ngOnInit(): Promise<void> {
    const spelers = (await this.client
      .collection('spelers')
      .getFullList()) as any[];

    this.spelers.set(spelers);
  }

  async delete(element: any) {
    await this.client.collection('spelers').delete(element.id);

    this.spelers.update((x) => x.filter((y: any) => y.id != element.id));
  }
}
