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
  aankomendeVoorstelling: WritableSignal<any | null> = signal(null);
  voorstellingen: WritableSignal<any[]> = signal([]);
  afgelopenVoorstellingen: WritableSignal<any[]> = signal([]);

  constructor(private router: Router) {
    this.groepsNaam = this.router.url.substring(1);

    effect(() => {
      console.log(this.voorstellingen());
    });

    effect(() => {
      console.log(this.groep());
    });
  }

  async ngOnInit(): Promise<void> {
    const voorstellingen = (
      await this.client.collection('voorstellingen').getFullList({
        sort: '-created',
      })
    ).filter((x: any) => x.groep.includes(this.groepsNaam.substring(0, 2)));

    const groep = (
      await this.client.collection('groepen').getFullList({
        sort: '-created',
      })
    ).filter((x: any) => x.naam.includes(this.groepsNaam.substring(0, 2)))[0];

    this.groep.set(groep as any);
    this.voorstellingen.set(voorstellingen as any);

    //* Haal de eerste voorstelling uit de lijst.
    //* Dat is de voorstelling die het laatst is aangemaakt.
    const laatstAangemaakteVoorstelling = voorstellingen.shift();

    this.aankomendeVoorstelling.set(laatstAangemaakteVoorstelling as any);
    this.afgelopenVoorstellingen.set(voorstellingen as any);
  }
}