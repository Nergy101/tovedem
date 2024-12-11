import {
  Component,
  WritableSignal,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { VoorstellingCardComponent } from '../../../shared/components/voorstellingen/voorstelling-card/voorstelling-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { Title } from '@angular/platform-browser';

import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { MatListModule } from '@angular/material/list';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { Groep } from '../../../models/domain/groep.model';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
    selector: 'app-groep',
    imports: [
        VoorstellingCardComponent,
        MatProgressSpinnerModule,
        RouterModule,
        MdbCarouselModule,
        MatListModule,
    ],
    templateUrl: './groep.component.html',
    styleUrl: './groep.component.scss'
})
export class GroepComponent {
  groepsNaam: string;
  url = 'https://pocketbase.nergy.space/';
  firstImg: any = ''
  client = inject(PocketbaseService);

  groep: WritableSignal<Groep | null> = signal(null);
  aankomendeVoorstelling: WritableSignal<Voorstelling | null | undefined> =
    signal(undefined);
  voorstellingen: WritableSignal<Voorstelling[]> = signal([]);
  afgelopenVoorstellingen: WritableSignal<Voorstelling[] | null> = signal(null);

  spelers: WritableSignal<any[] | null> = signal(null);
  slides: any[] | any = [];

  seoService = inject(SeoService);

  constructor(private router: Router) {

    this.groepsNaam = this.router.url.substring(7);

    effect(() => {
      if (!!this.groep()?.naam) {
        this.seoService.update(`Tovedem - Groep - ${this.groep()?.naam}`);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const voorstellingen = (
      await this.client.getAll<Voorstelling>('voorstellingen', {
        sort: '-created',
        expand: 'groep',
      })
    ).filter((x: any) => x.groep.includes(this.groepsNaam.substring(0, 3)));

    const groep = (
      await this.client.getAll<Groep>('groepen', {
        sort: '-created',
      })
    ).filter((x: any) => x.naam.includes(this.groepsNaam.substring(0, 2)))[0];

    this.groep.set(groep);
    this.voorstellingen.set(voorstellingen);

    //* Haal de eerste voorstelling uit de lijst.
    //* Dat is de voorstelling die het laatst is aangemaakt.
    const laatstAangemaakteVoorstelling = voorstellingen.shift() ?? null;

    const eerstVolgendeVoorstelling = (
      await this.client.getAll<Voorstelling>('voorstellingen')
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

    this.slides = groep.afbeeldingen?.map((img: string) => ({
      id: img,
      src: this.getImageUrl(groep.collectionId, groep.id, img),
    }));
    this.firstImg = this.slides[0];
    console.log(this.firstImg)
  }

  getImageUrl(collectionId: string, recordId: string, imageId: string): string {
    return `https://pocketbase.nergy.space/api/files/${collectionId}/${recordId}/${imageId}`;
  }
}
