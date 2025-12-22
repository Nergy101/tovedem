import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Groep } from '../../../models/domain/groep.model';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { VoorstellingLineComponent } from '../../../shared/components/voorstellingen/voorstelling-line/voorstelling-line.component';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';
import { DateTimeService } from '../../../shared/services/datetime.service';
import {
  getTodayStartAsUTC,
  getYearFromDate,
} from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatButtonModule,
    VoorstellingLineComponent,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
  ],
})
export class AgendaComponent implements OnInit {
  url = 'https://pocketbase.nergy.space/';
  client = inject(PocketbaseService);
  seoService = inject(SeoService);
  dateTimeService = inject(DateTimeService);

  // Use timezone-aware "today" for query filters
  today = getTodayStartAsUTC();

  voorstellingenShort: WritableSignal<Voorstelling[]> = signal([]);
  voorstellingenLong: WritableSignal<Voorstelling[]> = signal([]);
  groepen: WritableSignal<Groep[]> = signal([]);

  voorstellingenPerJaar: WritableSignal<
    { year: number; items: Voorstelling[] }[]
  > = signal([]);
  searchTerm = signal('');
  allVoorstellingenPerJaar: WritableSignal<
    { year: number; items: Voorstelling[] }[]
  > = signal([]);

  filteredVoorstellingenPerJaar = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    if (!search) {
      return this.voorstellingenPerJaar();
    }

    return this.voorstellingenPerJaar()
      .map((yearGroup) => ({
        year: yearGroup.year,
        items: yearGroup.items.filter(
          (voorstelling) =>
            voorstelling.titel.toLowerCase().includes(search) ||
            voorstelling.ondertitel?.toLowerCase().includes(search) ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (voorstelling.expand?.groep as any)?.naam
              ?.toLowerCase()
              .includes(search)
        ),
      }))
      .filter((yearGroup) => yearGroup.items.length > 0);
  });

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
        sort: 'datum_tijd_1',
        filter: `(datum_tijd_1 >= "${this.today}" || datum_tijd_2 >= "${this.today}") && gearchiveerd != true && (publicatie_datum <= "${this.today}" || publicatie_datum = "" || publicatie_datum = null)`,
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
    this.allVoorstellingenPerJaar.set(voorstellingenPerJaar);

    const voorstellingenInDeToekomstEnMaxVan6 =
      voorstellingenInDeToekomst.slice(0, 6);

    this.voorstellingenShort.set(voorstellingenInDeToekomstEnMaxVan6);
    this.voorstellingenLong.set(voorstellingenInDeToekomstEnMaxVan6);

    // Update Open Graph tags
    this.seoService.updateOpenGraphTags({
      title: 'Tovedem - Agenda',
      description:
        'Bekijk de agenda van Tovedem met alle aankomende voorstellingen en evenementen.',
      url: 'https://tovedem.nergy.space/agenda',
      type: 'website',
      siteName: 'Tovedem',
    });

    // Add EventSeries structured data
    if (voorstellingenInDeToekomst.length > 0) {
      const events = voorstellingenInDeToekomst.map((voorstelling) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventData: any = {
          '@type': 'TheaterEvent',
          name: voorstelling.titel,
          startDate: voorstelling.datum_tijd_1,
          endDate: voorstelling.datum_tijd_2 || voorstelling.datum_tijd_1,
          eventStatus: 'https://schema.org/EventScheduled',
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

        if (voorstelling.afbeelding) {
          eventData.image = `https://pocketbase.nergy.space/api/files/${voorstelling.collectionId}/${voorstelling.id}/${voorstelling.afbeelding}`;
        }

        if (voorstelling.expand?.groep?.naam) {
          eventData.performer = {
            '@type': 'TheaterGroup',
            name: voorstelling.expand.groep.naam,
          };
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

  groupByYear(
    fullList: Voorstelling[]
  ): { year: number; items: Voorstelling[] }[] {
    return Object.values(
      fullList.reduce((result, item) => {
        // Use timezone-aware year extraction
        const year =
          getYearFromDate(item.datum_tijd_1) ?? new Date().getFullYear();

        if (!result[year]) {
          result[year] = { year, items: [] };
        }

        result[year].items.push(item);

        return result;
      }, {} as Record<number, { year: number; items: Voorstelling[] }>)
    );
  }
}
