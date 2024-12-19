import {
  Component,
  OnInit,
  WritableSignal,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTreeModule } from '@angular/material/tree';
import { Title } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';

import { MatListModule } from '@angular/material/list';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { Groep } from '../../../models/domain/groep.model';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { Speler } from '../../../models/domain/speler.model';


@Component({
    selector: 'app-productie-info',
    imports: [
        MatProgressSpinnerModule,
        RouterModule,
        MdbCarouselModule,
        MatListModule,
        MatTreeModule,
    ],
    templateUrl: './productie-info.component.html',
    styleUrl: './productie-info.component.scss'
})
export class ProductieInfoComponent implements OnInit {
  groepsNaam: string;
  url = 'https://pocketbase.nergy.space/';

  client = inject(PocketbaseService);

  groep: WritableSignal<Groep | null> = signal(null);
  aankomendeVoorstelling: WritableSignal<Voorstelling | null | undefined> =
    signal(undefined);
  voorstellingen: WritableSignal<Voorstelling[]> = signal([]);
  afgelopenVoorstellingen: WritableSignal<Voorstelling[] | null> = signal(null);

  spelers: WritableSignal<Speler[] | null> = signal(null);
  slides: WritableSignal<{ id: number; title: string; description: string; src: string }[] | null> = signal(null);

  titleService = inject(Title);

  constructor(private router: Router) {
    this.groepsNaam = this.router.url.substring(16);

    effect(() => {
      if (this.groep()?.naam) {
        this.titleService.setTitle(`Tovedem - Groep - ${this.groep()?.naam} `);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const voorstellingen = (
      await this.client.getAll<Voorstelling>('voorstellingen', {
        sort: '-created',
        expand: 'groep',
      })
    ).filter((x: Voorstelling) => x.groep.includes(this.groepsNaam.substring(0, 3)));

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

    this.slides.set([
      {
        id: 1,
        src: '/assets/jalozien.jpg',
        title: 'Jalozien',
        description: 'Door Tovedem',
      },
      {
        id: 2,
        src: '/assets/Cloos-vrije-vogel.jpg',
        title: 'De Vrije Vogel',
        description: 'Door Cloos',
      },
    ]);
  }
}
