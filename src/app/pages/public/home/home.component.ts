import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDivider } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { Nieuws } from '../../../models/domain/nieuws.model';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { NieuwsCardComponent } from '../../../shared/components/nieuws-card/nieuws-card.component';
import { VoorstellingCardComponent } from '../../../shared/components/voorstellingen/voorstelling-card/voorstelling-card.component';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';
import { DateTimeService } from '../../../shared/services/datetime.service';
import { getTodayStartAsUTC } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [
    VoorstellingCardComponent,
    MatTabsModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatDivider,
    NieuwsCardComponent,
    MdbCarouselModule,
    NgOptimizedImage,
  ],
})
export class HomePaginaComponent implements OnInit {
  client = inject(PocketbaseService);
  dateTimeService = inject(DateTimeService);

  voorstellingen: WritableSignal<Voorstelling[]> = signal([]);
  nieuws: WritableSignal<Nieuws[]> = signal([]);
  seoService = inject(SeoService);
  nieuwsToPublish: WritableSignal<Nieuws[]> = signal([]);

  constructor() {
    this.seoService.update(
      'Tovedem - Home',
      'Welkom bij Tovedem De Meern! Een toneelgroep in De Meern, Utrecht. Hier vind je informatie over de voorstellingen, toneelgroepen en meer.'
    );
  }

  async ngOnInit(): Promise<void> {
    // Use timezone-aware "today" filter (Amsterdam timezone)
    const today = getTodayStartAsUTC();
    const voorstellingen = await this.client.getAll<Voorstelling>(
      'voorstellingen',
      {
        sort: 'datum_tijd_1',
        expand: 'groep',
        filter: `gearchiveerd != true && (datum_tijd_1 >= "${today}" || datum_tijd_2 >= "${today}")`,
      }
    );
    const nieuws = await this.client.getAll<Nieuws>('nieuws');

    nieuws.forEach((item) => {
      if (this.publiceren(item)) this.nieuwsToPublish().push(item);
    });

    this.voorstellingen.set(voorstellingen);
    this.nieuws.set(nieuws);

    // Update Open Graph tags
    this.seoService.updateOpenGraphTags({
      title: 'Tovedem - Home',
      description:
        'Welkom bij Tovedem De Meern! Een toneelgroep in De Meern, Utrecht. Hier vind je informatie over de voorstellingen, toneelgroepen en meer.',
      url: 'https://tovedem.nergy.space',
      type: 'website',
      siteName: 'Tovedem',
    });

    // Enhanced structured data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const structuredData: any = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': 'https://tovedem.nergy.space/#website',
          url: 'https://tovedem.nergy.space',
          name: 'Tovedem',
          description: 'Tovedem is een toneelvereniging in De Meern',
          publisher: {
            '@id': 'https://tovedem.nergy.space/#organization',
          },
          inLanguage: 'nl-NL',
        },
        {
          '@type': 'Organization',
          '@id': 'https://tovedem.nergy.space/#organization',
          name: 'Tovedem',
          url: 'https://tovedem.nergy.space',
          logo: {
            '@type': 'ImageObject',
            url: 'https://tovedem.nergy.space/assets/tovedem_logo.png',
          },
          description: 'Tovedem is een toneelvereniging in De Meern',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Orangjelaan 10',
            addressLocality: 'De Meern',
            postalCode: '3454 BT',
            addressCountry: 'NL',
          },
          sameAs: [
            'https://www.facebook.com/tovedem',
            'https://www.instagram.com/tovedem.demeern/',
          ],
        },
        {
          '@type': 'BreadcrumbList',
          '@id': 'https://tovedem.nergy.space/#breadcrumb',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://tovedem.nergy.space',
            },
          ],
        },
      ],
    };

    // Add upcoming event if available
    if (voorstellingen.length > 0 && voorstellingen[0]) {
      const firstVoorstelling = voorstellingen[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eventData: any = {
        '@type': 'TheaterEvent',
        name: firstVoorstelling.titel,
        startDate: firstVoorstelling.datum_tijd_1,
        endDate:
          firstVoorstelling.datum_tijd_2 || firstVoorstelling.datum_tijd_1,
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
          '@id': 'https://tovedem.nergy.space/#organization',
        },
      };

      if (firstVoorstelling.omschrijving) {
        eventData.description = firstVoorstelling.omschrijving;
      }

      if (firstVoorstelling.afbeelding) {
        eventData.image = `https://pocketbase.nergy.space/api/files/${firstVoorstelling.collectionId}/${firstVoorstelling.id}/${firstVoorstelling.afbeelding}`;
      }

      if (firstVoorstelling.expand?.groep?.naam) {
        eventData.performer = {
          '@type': 'TheaterGroup',
          name: firstVoorstelling.expand.groep.naam,
        };
      }

      if (firstVoorstelling.prijs_per_kaartje) {
        eventData.offers = {
          '@type': 'Offer',
          price: firstVoorstelling.prijs_per_kaartje,
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: `https://tovedem.nergy.space/reserveren?voorstellingid=${firstVoorstelling.id}`,
        };
      }

      structuredData['@graph'].push(eventData);
    }

    // Add Article structured data for published news items
    if (this.nieuwsToPublish().length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const articles = this.nieuwsToPublish().map((item): any => {
        const articleUrl = `https://tovedem.nergy.space`;
        const imageUrl = item.afbeelding
          ? `https://pocketbase.nergy.space/api/files/${item.collectionId}/${item.id}/${item.afbeelding}`
          : undefined;

        return {
          '@type': 'NewsArticle',
          headline: item.titel || 'Nieuws',
          datePublished: item.publishDate || item.created,
          dateModified: item.updated || item.publishDate || item.created,
          author: {
            '@type': 'Organization',
            name: 'Tovedem',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Tovedem',
            logo: {
              '@type': 'ImageObject',
              url: 'https://tovedem.nergy.space/assets/tovedem_logo.png',
            },
          },
          ...(imageUrl && { image: imageUrl }),
          ...(item.inhoud && {
            description: item.inhoud.replace(/<[^>]*>/g, '').substring(0, 200),
          }),
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': articleUrl,
          },
        };
      });

      // Add articles to structured data
      structuredData['@graph'].push(...articles);
    }

    this.seoService.updateStructuredData(structuredData);
  }

  publiceren(nieuws: Nieuws): boolean {
    // Use timezone-aware date comparisons
    return (
      this.dateTimeService.isPast(nieuws.publishDate) &&
      this.dateTimeService.isFuture(nieuws.archiveDate)
    );
  }

  archiveren(nieuws: Nieuws): boolean {
    return this.dateTimeService.isFuture(nieuws.archiveDate);
  }

  getNieuwsLabel(nieuws: Nieuws): string {
    // Use timezone-aware date formatting
    const formattedDate = nieuws.publishDate
      ? this.dateTimeService.formatDate(nieuws.publishDate, 'dd-MM-yyyy')
      : '';
    return `${formattedDate} | ${nieuws.titel}`;
  }
}
