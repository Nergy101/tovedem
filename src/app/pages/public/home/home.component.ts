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

  voorstellingen: WritableSignal<Voorstelling[]> = signal([]);
  nieuws: WritableSignal<Nieuws[]> = signal([]);
  seoService = inject(SeoService);
  nieuwsToPublish: WritableSignal<Nieuws[]> = signal([]);

  constructor() {
    this.seoService.update('Tovedem - Home');
  }

  async ngOnInit(): Promise<void> {
    const voorstellingen = await this.client.getAll<Voorstelling>(
      'voorstellingen',
      {
        sort: '-datum_tijd_1',
        expand: 'groep',
      }
    );
    const nieuws = await this.client.getAll<Nieuws>('nieuws', {
      sort: '-publishDate',
    });

    nieuws.forEach((item) => {
      if (this.publiceren(item)) this.nieuwsToPublish().push(item);
    });

    this.voorstellingen.set(voorstellingen);
    this.nieuws.set(nieuws);

    this.seoService.updateStructuredData({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Tovedem',
      url: 'https://tovedem.nergy.space',
      description: 'Tovedem is een toneelvereniging in de Meern',
      audience: {
        '@type': 'Audience',
        audienceType: 'Liefhebbers van Theater en Toneel',
      },
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'NL',
        addressLocality: 'De Meern',
        addressRegion: 'BT',
        postalCode: '3454',
        streetAddress: 'De Schalm, Orangjelaan 10',
      },
      theaterEvent: {
        '@type': 'TheaterEvent',
        name: this.voorstellingen()[0].titel,
        startDate: this.voorstellingen()[0].datum_tijd_1,
        endDate:
          this.voorstellingen()[0].datum_tijd_2 ??
          this.voorstellingen()[0].datum_tijd_1,
        director: this.voorstellingen()[0].regie,
        url: `https://tovedem.nergy.space/reserveren?voorstellingid=${
          this.voorstellingen()[0].id
        }`,
      },
    });
  }
  publiceren(nieuws: Nieuws): boolean {
    return (
      new Date(nieuws.publishDate ?? '') < new Date() &&
      new Date(nieuws.archiveDate ?? '') > new Date()
    );
  }

  archiveren(nieuws: Nieuws): boolean {
    return new Date(nieuws.archiveDate ?? '') > new Date();
  }
}
