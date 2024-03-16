import { Injectable } from '@angular/core';

import PocketBase from 'pocketbase';
import Page from '../../models/pocketbase/page.model';

@Injectable({
  providedIn: 'root',
})
export class PocketbaseService {
  private url = 'https://tovedem.pockethost.io/';
  client: PocketBase;

  constructor() {
    this.client = new PocketBase(this.url);
  }

  async create<T>(collectionName: string, item: any): Promise<T> {
    return this.client.collection(collectionName).create(item);
  }

  async delete(collectionName: string, id: string): Promise<boolean> {
    return await this.client.collection(collectionName).delete(id);
  }

  async getAll<T>(collectionName: string, expand?: string): Promise<T[]> {
    return await this.getCollection(collectionName).getFullList({ expand });
  }

  async getPage<T>(
    collectionName: string,
    page: number,
    perPage: number,
    expand?: string
  ): Promise<Page<T>> {
    const pbPage = await this.getCollection(collectionName).getList(
      page,
      perPage,
      { expand }
    );

    const pageModel = {
      page,
      perPage,
      items: pbPage.items,
      totalItems: pbPage.totalItems,
      totalPages: pbPage.totalPages,
    } as Page<T>;

    return pageModel;
  }

  private getCollection(nameOrId: string) {
    return this.client.collection(nameOrId);
  }
}
