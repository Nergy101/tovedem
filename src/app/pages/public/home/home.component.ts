import { Component, WritableSignal, inject, signal } from '@angular/core';
import { VoorstellingCardComponent } from '../../../shared/components/voorstellingen/voorstelling-card/voorstelling-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [VoorstellingCardComponent, MatProgressSpinnerModule],
})
export class HomePaginaComponent {
  client = inject(PocketbaseService).client;

  voorstellingen: WritableSignal<any[]> = signal([]);

  titleService = inject(Title);
  constructor() {
    this.titleService.setTitle('Tovedem - Home');
  }
  async ngOnInit(): Promise<void> {
    const voorstellingen = await this.client
      .collection('voorstellingen')
      .getFullList({
        sort: '-created',
        expand: 'groep'
      });

    this.voorstellingen.set(voorstellingen as any);
  }
}
