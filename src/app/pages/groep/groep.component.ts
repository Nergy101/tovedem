import {
  Component,
  WritableSignal,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { VoorstellingCardComponent } from '../../shared/components/voorstellingen/voorstelling-card/voorstelling-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PocketbaseService } from '../../shared/services/pocketbase.service';

@Component({
  selector: 'app-groep',
  standalone: true,
  imports: [VoorstellingCardComponent, MatProgressSpinnerModule],
  templateUrl: './groep.component.html',
  styleUrl: './groep.component.scss',
})
export class GroepComponent {
  groepsNaam: string;
  url = 'https://tovedem.pockethost.io/';

  client = inject(PocketbaseService).client;

  groep: WritableSignal<any | null> = signal(null);
  aankomendeVoorstelling: WritableSignal<any | null | undefined> =
    signal(undefined);
  voorstellingen: WritableSignal<any[]> = signal([]);
  afgelopenVoorstellingen: WritableSignal<any[] | null> = signal(null);

  spelers: WritableSignal<any[] | null> = signal(null);

  constructor(private router: Router) {
    this.groepsNaam = this.router.url.substring(7);
  }

  async ngOnInit(): Promise<void> {
    const voorstellingen = (
      await this.client.collection('voorstellingen').getFullList({
        sort: '-created',
        expand: 'groep',
      })
    ).filter((x: any) =>
      x.groep.includes(this.groepsNaam.substring(0, 3))
    ) as any;

    const groep = (
      await this.client.collection('groepen').getFullList({
        sort: '-created',
      })
    ).filter((x: any) =>
      x.naam.includes(this.groepsNaam.substring(0, 2))
    )[0] as any;

    this.groep.set(groep);
    this.voorstellingen.set(voorstellingen);

    //* Haal de eerste voorstelling uit de lijst.
    //* Dat is de voorstelling die het laatst is aangemaakt.
    const laatstAangemaakteVoorstelling = voorstellingen.shift();

    const eerstVolgendeVoorstelling = (
      (await this.client.collection('voorstellingen').getFullList()) as any[]
    ).sort((x, y) => (new Date(x.created) < new Date(y.created) ? 1 : -1))[0];

    console.log('1', eerstVolgendeVoorstelling);

    const eerstVolgendeVoorstellingMetSpelers = (await this.client
      .collection('voorstellingen')
      .getOne(eerstVolgendeVoorstelling.id, {
        expand: 'spelers',
      })) as any;

    console.log('2', eerstVolgendeVoorstellingMetSpelers);

    this.spelers.set(eerstVolgendeVoorstellingMetSpelers?.expand?.spelers);

    this.aankomendeVoorstelling.set(laatstAangemaakteVoorstelling as any);
    this.afgelopenVoorstellingen.set(voorstellingen as any);
  }
}
