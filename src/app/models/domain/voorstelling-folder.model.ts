import { BaseModel } from 'pocketbase';
import { Groep } from './groep.model';
import { Voorstelling } from './voorstelling.model';

export interface VoorstellingFolderVoorstelling extends Voorstelling {
  expand?: {
    groep?: Groep;
  };
}

export interface VoorstellingFolder extends BaseModel {
  naam: string;
  jaar: number;
  voorstelling?: string; // relation to voorstellingen
  fotos: string[]; // primary array of file names
  fotos_2?: string[];
  fotos_3?: string[];
  fotos_4?: string[];
  fotos_5?: string[];
  expand?: {
    voorstelling?: VoorstellingFolderVoorstelling;
  };
}

