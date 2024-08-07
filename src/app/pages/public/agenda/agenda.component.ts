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
import { VoorstellingCardComponent } from '../../../shared/components/voorstellingen/voorstelling-card/voorstelling-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VoorstellingLineComponent } from '../../../shared/components/voorstellingen/voorstelling-line/voorstelling-line.component';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { MatDividerModule } from '@angular/material/divider';
import { Title } from '@angular/platform-browser';
import Voorstelling from '../../../models/domain/voorstelling.model';
import Groep from '../../../models/domain/groep.model';

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
    MatDividerModule,
  ],
})
export class AgendaComponent implements OnInit {
  url = 'https://pocketbase.nergy.space/';
  client = inject(PocketbaseService);
  titleService = inject(Title);

  today = new Date().toISOString();

  voorstellingenShort: WritableSignal<Voorstelling[]> = signal([]);
  voorstellingenLong: WritableSignal<Voorstelling[]> = signal([]);
  groepen: WritableSignal<Groep[]> = signal([]);

  voorstellingenPerJaar: WritableSignal<{ year: number; items: any[] }[]> =
    signal([]);

  constructor() {
    this.titleService.setTitle('Tovedem - Agenda');
  }

  async ngOnInit(): Promise<void> {
    const voorstellingenInDeToekomst = await this.client.getAll<Voorstelling>(
      'voorstellingen',
      {
        sort: '-datum_tijd_1',
        filter: `datum_tijd_1 >= "${this.today}" || datum_tijd_2 >= "${this.today}"`,
        expand: 'groep',
      }
    );

    const groepen = await this.client.getAll<Groep>('groepen', {
      sort: '-created',
    });
    this.groepen.set(groepen as any);

    const voorstellingenPerJaar = this.groupByYear(
      voorstellingenInDeToekomst
    ).sort((x, y) => (x.year > y.year ? -1 : 1));

    this.voorstellingenPerJaar.set(voorstellingenPerJaar);

    const voorstellingenInDeToekomstEnMaxVan6 =
      voorstellingenInDeToekomst.slice(0, 6);

    this.voorstellingenShort.set(voorstellingenInDeToekomstEnMaxVan6 as any);
    this.voorstellingenLong.set(voorstellingenInDeToekomstEnMaxVan6 as any);
  }

  groupByYear(fullList: any[]): { year: number; items: any[] }[] {
    return Object.values(
      fullList.reduce((result, item) => {
        const year = new Date(item.datum_tijd_1).getFullYear();

        if (!result[year]) {
          result[year] = { year, items: [] };
        }

        result[year].items.push(item);

        return result;
      }, {} as Record<number, { year: number; items: any[] }>)
    );
  }
}
