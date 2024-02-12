import { Component, OnInit, WritableSignal, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import PocketBase from 'pocketbase';

@Component({
  selector: 'app-lid-worden',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './lid-worden.component.html',
  styleUrl: './lid-worden.component.scss',
})
export class LidWordenComponent implements OnInit {
  url = 'https://tovedem.pockethost.io/';
  client: PocketBase;

  content1: WritableSignal<string | null> = signal(null);
  content2: WritableSignal<string | null> = signal(null);
  content3: WritableSignal<string | null> = signal(null);

  constructor() {
    this.client = new PocketBase(this.url);
  }

  async ngOnInit(): Promise<void> {
    const record = (await this.client.collection('lid_worden').getList(1, 1))
      .items[0];

    this.content1.set((record as any).tekst_1);
    this.content2.set((record as any).tekst_2);
    this.content3.set((record as any).tekst_3);
  }
}
