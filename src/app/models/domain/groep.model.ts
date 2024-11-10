import { BaseModel } from 'pocketbase';

export interface Groep extends BaseModel {
  naam: string;
  omschrijving?: string;
  afbeeldingen?: string[];
}
