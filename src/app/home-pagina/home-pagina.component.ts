import { Component, WritableSignal, inject, signal } from '@angular/core';
import { VoorstellingCardComponent } from '../shared/voorstelling-card/voorstelling-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PocketbaseService } from '../services/pocketbase.service';

@Component({
  selector: 'app-home-pagina',
  standalone: true,
  templateUrl: './home-pagina.component.html',
  styleUrl: './home-pagina.component.scss',
  imports: [VoorstellingCardComponent, MatProgressSpinnerModule],
})
export class HomePaginaComponent {
  client = inject(PocketbaseService).client;

  voorstellingen: WritableSignal<any[]> = signal([]);

  async ngOnInit(): Promise<void> {
    const voorstellingen = await this.client
      .collection('voorstellingen')
      .getFullList({
        sort: '-created',
      });

    this.voorstellingen.set(voorstellingen as any);
  }
}
