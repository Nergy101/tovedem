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
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-beheer-spelers',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './beheer-spelers.component.html',
  styleUrl: './beheer-spelers.component.scss',
})
export class BeheerSpelersComponent implements OnInit {
  loading = signal(false);

  spelers: WritableSignal<any | null> = signal(null);

  spelerNaam?: string;

  client = inject(PocketbaseService).client;

  displayedColumns = ['id', 'naam', 'actions'];

  async ngOnInit(): Promise<void> {
    const spelers = (await this.client
      .collection('spelers')
      .getFullList()) as any[];

    this.spelers.set(spelers);
  }

  async createSpeler() {
    this.loading.set(true);

    const result = await this.client
      .collection('spelers')
      .create({ naam: this.spelerNaam });

    console.log(result);

    this.spelers.update((x) => [...x, result]);

    this.spelerNaam = '';
    this.loading.set(false);
  }

  async delete(element: any) {
    this.loading.set(true);
    await this.client.collection('spelers').delete(element.id);

    this.spelers.update((x) => x.filter((y: any) => y.id != element.id));
    this.loading.set(false);
  }
}
