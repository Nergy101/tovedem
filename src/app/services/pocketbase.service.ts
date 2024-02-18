import { Injectable } from '@angular/core';

import PocketBase from 'pocketbase';

@Injectable({
  providedIn: 'root',
})
export class PocketbaseService {
  url = 'https://tovedem.pockethost.io/';
  client: PocketBase;

  constructor() {
    this.client = new PocketBase(this.url);
  }
}
