import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { VoorstellingCardComponent } from '../shared/voorstelling-card/voorstelling-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PocketbaseService } from '../services/pocketbase.service';

@Component({
  selector: 'app-agenda',
  standalone: true,
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    VoorstellingCardComponent,
    MatProgressSpinnerModule,
  ],
})
export class AgendaComponent implements OnInit {
  url = 'https://tovedem.pockethost.io/';
  client = inject(PocketbaseService).client;

  today = new Date().toISOString();

  voorstellingen: WritableSignal<any[]> = signal([]);
  groepen: WritableSignal<any[]> = signal([]);

  async ngOnInit(): Promise<void> {
    const voorstellingenInDeToekomstEnMaxVan6 = (
      await this.client.collection('voorstellingen').getFullList({
        sort: '-created',
        filter: `datum_tijd_1 >= "${this.today}" || datum_tijd_2 >= "${this.today}"`,
      })
    ).slice(0, 6);

    const groepen = await this.client.collection('groepen').getFullList({
      sort: '-created',
    });

    this.voorstellingen.set(voorstellingenInDeToekomstEnMaxVan6 as any);
    this.groepen.set(groepen as any);
  }
}
