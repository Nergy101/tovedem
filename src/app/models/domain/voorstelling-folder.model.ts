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
  fotos: string[]; // array of file names
  expand?: {
    voorstelling?: VoorstellingFolderVoorstelling;
  };
}
