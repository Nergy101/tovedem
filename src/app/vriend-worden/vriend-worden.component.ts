import { Component, OnInit, WritableSignal, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import PocketBase from 'pocketbase';

@Component({
  selector: 'app-vriend-worden',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './vriend-worden.component.html',
  styleUrl: './vriend-worden.component.scss',
})
export class VriendWordenComponent implements OnInit {
  url = 'https://tovedem.pockethost.io/';
  client: PocketBase;

  content: WritableSignal<string | null> = signal(null);

  constructor() {
    this.client = new PocketBase(this.url);
  }

  async ngOnInit(): Promise<void> {
    const record = (await this.client.collection('vriend_worden').getList(1, 1))
      .items[0];
    this.content.set((record as any).tekst_1);
  }
}
