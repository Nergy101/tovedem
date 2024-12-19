import { BaseModel } from 'pocketbase';

export interface LosseVerkoop extends BaseModel {
  aantal: number;
  voorstelling: string;
  datum: 'datum1' | 'datum2';
}
