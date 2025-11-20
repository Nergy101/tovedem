import { BaseModel } from 'pocketbase';

export interface Sponsor extends BaseModel {
  voornaam: string;
  achternaam: string;
  type: 'sponsor' | 'vriend' | 'ere-lid' | 'ere-mejoto';
  email: string;
}



