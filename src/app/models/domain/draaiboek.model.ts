import { BaseModel } from 'pocketbase';

export type DraaiboekGroep = 'Tovedem' | 'Cloos' | 'Mejotos';

export interface DraaiboekRol {
  rol: string;
  omschrijving: string;
}

export interface DraaiboekSectie {
  titel: string;
  punten: string[];
}

export interface DraaiboekItem {
  /** Leeg = hoort bij de tijd van het vorige item. */
  tijd: string;
  actie: string;
  /** Rollen (geen namen!) die de actie uitvoeren. */
  door: string[];
  notitie?: string;
  belangrijk?: boolean;
}

export interface DraaiboekDag {
  naam: string;
  omschrijving?: string;
  items: DraaiboekItem[];
}

export interface DraaiboekInhoud {
  titel: string;
  intro: string;
  rollen: DraaiboekRol[];
  secties: DraaiboekSectie[];
  dagen: DraaiboekDag[];
}

export interface Draaiboek extends BaseModel {
  groep: DraaiboekGroep;
  inhoud: DraaiboekInhoud;
}
