import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Groep } from '../../../models/domain/groep.model';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { VoorstellingLineComponent } from '../../../shared/components/voorstellingen/voorstelling-line/voorstelling-line.component';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
    selector: 'app-agenda',
    templateUrl: './agenda.component.html',
    styleUrl: './agenda.component.scss',
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        VoorstellingLineComponent,
        MatProgressSpinnerModule,
        MatDividerModule,
    ]
})
export class AgendaComponent implements OnInit {
  url = 'https://pocketbase.nergy.space/';
  client = inject(PocketbaseService);
  seoService = inject(SeoService);

  today = new Date().toISOString();

  voorstellingenShort: WritableSignal<Voorstelling[]> = signal([]);
  voorstellingenLong: WritableSignal<Voorstelling[]> = signal([]);
  groepen: WritableSignal<Groep[]> = signal([]);

  voorstellingenPerJaar: WritableSignal<{ year: number; items: Voorstelling[] }[]> =
    signal([]);

  constructor() {
    this.seoService.update(
      'Tovedem - Agenda',
      'Bekijk de agenda van Tovedem met alle aankomende voorstellingen en evenementen.'
    );
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
    this.groepen.set(groepen);

    const voorstellingenPerJaar = this.groupByYear(
      voorstellingenInDeToekomst
    ).sort((x, y) => (x.year > y.year ? 1 : -1));

    this.voorstellingenPerJaar.set(voorstellingenPerJaar);

    const voorstellingenInDeToekomstEnMaxVan6 =
      voorstellingenInDeToekomst.slice(0, 6);

    this.voorstellingenShort.set(voorstellingenInDeToekomstEnMaxVan6);
    this.voorstellingenLong.set(voorstellingenInDeToekomstEnMaxVan6);

    // Update Open Graph tags
    this.seoService.updateOpenGraphTags({
      title: 'Tovedem - Agenda',
      description: 'Bekijk de agenda van Tovedem met alle aankomende voorstellingen en evenementen.',
      url: 'https://tovedem.nergy.space/agenda',
      type: 'website',
      siteName: 'Tovedem',
    });

    // Add EventSeries structured data
    if (voorstellingenInDeToekomst.length > 0) {
      const events = voorstellingenInDeToekomst.map((voorstelling) => {
        const eventData: any = {
          '@type': 'TheaterEvent',
          name: voorstelling.titel,
          startDate: voorstelling.datum_tijd_1,
          endDate: voorstelling.datum_tijd_2 || voorstelling.datum_tijd_1,
          location: {
            '@type': 'Place',
            name: 'De Schalm',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Orangjelaan 10',
              addressLocality: 'De Meern',
              postalCode: '3454 BT',
              addressCountry: 'NL',
            },
          },
          organizer: {
            '@type': 'Organization',
            name: 'Tovedem',
            url: 'https://tovedem.nergy.space',
          },
        };

        if (voorstelling.omschrijving) {
          eventData.description = voorstelling.omschrijving;
        }

        if (voorstelling.prijs_per_kaartje) {
          eventData.offers = {
            '@type': 'Offer',
            price: voorstelling.prijs_per_kaartje,
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            url: `https://tovedem.nergy.space/reserveren?voorstellingid=${voorstelling.id}`,
          };
        }

        return eventData;
      });

      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'EventSeries',
        name: 'Tovedem Voorstellingen',
        description: 'Aankomende voorstellingen van Tovedem',
        organizer: {
          '@type': 'Organization',
          name: 'Tovedem',
          url: 'https://tovedem.nergy.space',
        },
        event: events,
      };

      this.seoService.updateStructuredData(structuredData);
    }
  }

  groupByYear(fullList: Voorstelling[]): { year: number; items: Voorstelling[] }[] {
    return Object.values(
      fullList.reduce((result, item) => {
        const year = new Date(item.datum_tijd_1).getFullYear();

        if (!result[year]) {
          result[year] = { year, items: [] };
        }

        result[year].items.push(item);

        return result;
      }, {} as Record<number, { year: number; items: Voorstelling[] }>)
    );
  }
}
