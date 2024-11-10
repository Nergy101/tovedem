import { BaseModel } from 'pocketbase';

export interface Gebruiker extends BaseModel {
  username: string;
  email: string;
  name: string;
  rollen: string[];
  avatar?: string;
  groep?: string;
  speler?: string;
}
