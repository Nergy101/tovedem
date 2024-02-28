import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import PocketBase from 'pocketbase';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { VoorstellingCardComponent } from '../../shared/components/voorstellingen/voorstelling-card/voorstelling-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VoorstellingLineComponent } from '../../shared/components/voorstellingen/voorstelling-line/voorstelling-line.component';
import { PocketbaseService } from '../../shared/services/pocketbase.service';

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
    VoorstellingLineComponent,
    MatProgressSpinnerModule,
  ],
})
export class AgendaComponent implements OnInit {
  url = 'https://tovedem.pockethost.io/';
  client = inject(PocketbaseService).client;

  today = new Date().toISOString();

  voorstellingenShort: WritableSignal<any[]> = signal([]);
  voorstellingenLong: WritableSignal<any[]> = signal([]);
  groepen: WritableSignal<any[]> = signal([]);

  async ngOnInit(): Promise<void> {
    const voorstellingenInDeToekomst = (
      await this.client.collection('voorstellingen').getFullList({
        sort: '-created',
        filter: `datum_tijd_1 >= "${this.today}" || datum_tijd_2 >= "${this.today}"`,
      })
    )
    const voorstellingenInDeToekomstEnMaxVan6 = voorstellingenInDeToekomst.slice(0, 6);
    const groepen = await this.client.collection('groepen').getFullList({
      sort: '-created',
    });

    this.voorstellingenShort.set(voorstellingenInDeToekomstEnMaxVan6 as any);
    this.voorstellingenLong.set(voorstellingenInDeToekomstEnMaxVan6 as any);
    this.groepen.set(groepen as any);
  }
}
