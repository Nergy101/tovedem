import { Component, WritableSignal, inject, signal } from '@angular/core';
import { VoorstellingCardComponent } from '../../../shared/components/voorstellingen/voorstelling-card/voorstelling-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { Meta, Title } from '@angular/platform-browser';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [VoorstellingCardComponent, MatProgressSpinnerModule],
})
export class HomePaginaComponent {
  client = inject(PocketbaseService);

  voorstellingen: WritableSignal<Voorstelling[]> = signal([]);

  seoService = inject(SeoService);

  constructor() {
    this.seoService.update('Tovedem - Home')

  }

  async ngOnInit(): Promise<void> {
    const voorstellingen = await this.client.getAll<Voorstelling>(
      'voorstellingen',
      {
        sort: '-created',
        expand: 'groep',
      }
    );

    this.voorstellingen.set(voorstellingen);

    this.seoService.updateStructuredData({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Tovedem",
      "url": "https://tovedem.nergy.space",
      "description": "Tovedem is een toneelvereniging in de Meern",
      "audience": {
        "@type": "Audience",
        "audienceType": "Liefhebbers van Theater en Toneel"
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "NL",
        "addressLocality": "De Meern",
        "addressRegion": "BT",
        "postalCode": "3454",
        "streetAddress": "De Schalm, Orangjelaan 10"
      },
      "theaterEvent": {
        "@type": "TheaterEvent",
        "name": this.voorstellingen()[0].titel,
        'startDate': this.voorstellingen()[0].datum_tijd_1,
        'endDate': this.voorstellingen()[0].datum_tijd_2 ?? this.voorstellingen()[0].datum_tijd_1,
        "director": this.voorstellingen()[0].regie,
        "url": `https://tovedem.nergy.space/reserveren?voorstelling=${this.voorstellingen()[0].id}`,
      }
    });
  }
}
