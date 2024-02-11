import { CommonModule } from '@angular/common';
import { Component, OnInit, WritableSignal, signal } from '@angular/core';
import PocketBase from 'pocketbase';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { VoorstellingCardComponent } from '../shared/voorstelling-card/voorstelling-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-agenda',
  standalone: true,
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    VoorstellingCardComponent,
    MatProgressSpinnerModule,
  ],
})
export class AgendaComponent implements OnInit {
  url = 'https://tovedem.pockethost.io/';
  client: PocketBase;

  voorstellingen: WritableSignal<any[]> = signal([]);
  groepen: WritableSignal<any[]> = signal([]);

  constructor() {
    this.client = new PocketBase(this.url);
  }

  async ngOnInit(): Promise<void> {
    const voorstellingen = await this.client
      .collection('voorstellingen')
      .getFullList({
        sort: '-created',
      });

    const groepen = await this.client.collection('groepen').getFullList({
      sort: '-created',
    });

    this.voorstellingen.set(voorstellingen as any);
    this.groepen.set(groepen as any);
  }
}
