import { BaseModel } from 'pocketbase';

export default interface Groep extends BaseModel {
  naam: string;
  omschrijving?: string;
  afbeeldingen?: string[];
}
