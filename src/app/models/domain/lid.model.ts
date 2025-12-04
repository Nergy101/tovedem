import { BaseModel } from 'pocketbase';
import { Groep } from './groep.model';

export interface Lid extends BaseModel {
  voornaam: string;
  achternaam: string;
  email: string;
  groep?: string;
  bericht: string;
  geboorte_datum: string;
  status?: 'nieuw' | 'geverifieerd' | 'gekoppeld';
  expand?: {
    groep?: Groep;
  };
}

