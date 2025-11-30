import {
  Component,
  OnInit,
  WritableSignal,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { VoorstellingCardComponent } from '../../../shared/components/voorstellingen/voorstelling-card/voorstelling-card.component';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';

import { MatListModule } from '@angular/material/list';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { Groep } from '../../../models/domain/groep.model';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { SeoService } from '../../../shared/services/seo.service';
import { Speler } from '../../../models/domain/speler.model';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-groep',
  imports: [
    VoorstellingCardComponent,
    MatProgressSpinnerModule,
    RouterModule,
    MdbCarouselModule,
    MatListModule,
    NgOptimizedImage
  ],
  templateUrl: './groep.component.html',
  styleUrl: './groep.component.scss',
})
export class GroepComponent implements OnInit {
  groepsNaam: string;
  url = 'https://pocketbase.nergy.space/';
  firstImg = signal('');
  client = inject(PocketbaseService);

  groep: WritableSignal<Groep | null> = signal(null);
  aankomendeVoorstelling: WritableSignal<Voorstelling | null | undefined> =
    signal(undefined);
  voorstellingen: WritableSignal<Voorstelling[]> = signal([]);
  afgelopenVoorstellingen: WritableSignal<Voorstelling[] | null> = signal(null);

  spelers: WritableSignal<Speler[] | null> = signal(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  slides = signal<any[]>([]);

  seoService = inject(SeoService);

  constructor(private router: Router) {
    this.groepsNaam = this.router.url.substring(7);

    effect(() => {
      const groepsNaam = this.groep()?.naam;
      if (groepsNaam) {
        this.seoService.update(
          `Tovedem - Groep - ${groepsNaam}`,
          `Informatie over ${groepsNaam}, een toneelgroep binnen Tovedem.`
        );
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const voorstellingen = (
      await this.client.getAll<Voorstelling>('voorstellingen', {
        sort: '-created',
        expand: 'groep',
        filter: 'gearchiveerd != true',
      })
    ).filter((x: Voorstelling) =>
      x.groep.includes(this.groepsNaam.substring(0, 3))
    );

    const groep = (
      await this.client.getAll<Groep>('groepen', {
        sort: '-created',
      })
    ).filter((x: Groep) => x.naam.includes(this.groepsNaam.substring(0, 2)))[0];

    this.groep.set(groep);
    this.voorstellingen.set(voorstellingen);

    //* Haal de eerste voorstelling uit de lijst.
    //* Dat is de voorstelling die het laatst is aangemaakt.
    const laatstAangemaakteVoorstelling = voorstellingen.shift() ?? null;

    const eerstVolgendeVoorstelling = (
      await this.client.getAll<Voorstelling>('voorstellingen', {
        filter: 'gearchiveerd != true',
      })
    ).sort((x, y) => (new Date(x.created) < new Date(y.created) ? 1 : -1))[0];

    const eerstVolgendeVoorstellingMetSpelers =
      await this.client.getOne<Voorstelling>(
        'voorstellingen',
        eerstVolgendeVoorstelling.id,
        {
          expand: 'spelers',
        }
      );

    this.spelers.set(eerstVolgendeVoorstellingMetSpelers?.expand?.spelers);
    this.aankomendeVoorstelling.set(laatstAangemaakteVoorstelling ?? null);

    this.afgelopenVoorstellingen.set(voorstellingen);

    this.slides.set(groep.afbeeldingen?.map((img: string) => ({
      id: img,
      src: this.getImageUrl(groep.collectionId, groep.id, img),
    })) ?? []);
    this.firstImg.set(this.slides()[0]?.src ?? '');

    // Add Organization structured data
    if (groep) {
      const groupUrl = `https://tovedem.nergy.space/groep/${groep.naam}`;
      const images = this.slides().map((slide) => slide.src);

      this.seoService.updateOpenGraphTags({
        title: `Tovedem - Groep - ${groep.naam}`,
        description: groep.omschrijving || `Informatie over ${groep.naam}, een toneelgroep binnen Tovedem.`,
        url: groupUrl,
        type: 'website',
        siteName: 'Tovedem',
        ...(images.length > 0 && { image: images[0] }),
      });

      this.seoService.updateStructuredDataForOrganization({
        name: groep.naam,
        description: groep.omschrijving,
        url: groupUrl,
        ...(images.length > 0 && { logo: images[0] }),
        ...(images.length > 0 && { image: images }),
        sameAs: [
          'https://www.facebook.com/tovedem',
          'https://www.instagram.com/tovedem.demeern/',
        ],
      });
    }
  }

  getImageUrl(collectionId: string, recordId: string, imageId: string): string {
    return `https://pocketbase.nergy.space/api/files/${collectionId}/${recordId}/${imageId}`;
  }
}
