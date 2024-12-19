/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';

import PocketBase, { BaseModel, RecordModel, RecordService } from 'pocketbase';
import { Page } from '../../models/pocketbase/page.model';
import { Environment } from '../../../environment';

@Injectable({
  providedIn: 'root',
})
export class PocketbaseService {
  environment = inject(Environment);
  client: PocketBase;

  constructor() {
    this.client = new PocketBase(this.environment.pocketbase.baseUrl);
  }

  async create<T>(collectionName: string, item: Partial<T>): Promise<T> {
    return this.getCollection(collectionName).create(item as any);
  }

  async update<T extends BaseModel>(
    collectionName: string,
    item: T
  ): Promise<T> {
    return this.getCollection(collectionName).update(item.id, item);
  }

  async delete(collectionName: string, id: string): Promise<boolean> {
    return await this.client.collection(collectionName).delete(id);
  }

  async getOne<T>(
    collectionName: string,
    id: string,
    options?: {
      expand?: string;
      filter?: string;
      sort?: string;
    }
  ): Promise<T> {
    return await this.getCollection(collectionName).getOne(id, options);
  }

  async getAll<T>(
    collectionName: string,
    options?: {
      expand?: string;
      filter?: string;
      sort?: string;
    }
  ): Promise<T[]> {
    return await this.getCollection(collectionName).getFullList(options);
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

    console.log('pbPage', pbPage);

    const pageModel = {
      page,
      perPage,
      items: pbPage.items,
      totalItems: pbPage.totalItems,
      totalPages: pbPage.totalPages,
    } as Page<T>;

    console.log('pageModel', pageModel);

    return pageModel;
  }

  async getFileToken(): Promise<string> {
    return await this.client.files.getToken();
  }

  private getCollection(nameOrId: string): RecordService<RecordModel> {
    return this.client.collection(nameOrId);
  }
}
