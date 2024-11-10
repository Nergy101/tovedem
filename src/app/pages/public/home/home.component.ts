import { Component, WritableSignal, inject, signal } from '@angular/core';
import { VoorstellingCardComponent } from '../../../shared/components/voorstellingen/voorstelling-card/voorstelling-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { Title } from '@angular/platform-browser';
import { Voorstelling } from '../../../models/domain/voorstelling.model';

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

  titleService = inject(Title);
  constructor() {
    this.titleService.setTitle('Tovedem - Home');
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
  }
}
