import { BaseModel } from 'pocketbase';

export interface Nieuws extends BaseModel {
  titel?: string;
  inhoud?: string;
  afbeelding?: string;
  publishDate?: string;
  archiveDate?: string; 
}
