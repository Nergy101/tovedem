import { Component, WritableSignal, signal } from '@angular/core';
import { VoorstellingCardComponent } from '../shared/voorstelling-card/voorstelling-card.component';

import PocketBase from 'pocketbase';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-home-pagina',
  standalone: true,
  templateUrl: './home-pagina.component.html',
  styleUrl: './home-pagina.component.scss',
  imports: [VoorstellingCardComponent, MatProgressSpinnerModule],
})
export class HomePaginaComponent {
  url = 'https://tovedem.pockethost.io/';
  client: PocketBase;

  voorstellingen: WritableSignal<any[]> = signal([]);

  constructor() {
    this.client = new PocketBase(this.url);
  }

  async ngOnInit(): Promise<void> {
    const voorstellingen = await this.client
      .collection('voorstellingen')
      .getFullList({
        sort: '-created',
      });

    const groepen = await this.client.collection('groepen').getFullList({
      sort: '-created',
    });

    this.voorstellingen.set(voorstellingen as any);
  }
}
