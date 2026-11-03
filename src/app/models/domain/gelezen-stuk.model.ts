import { BaseModel } from 'pocketbase';

export type LeesAdvies = 'aanrader' | 'misschien' | 'afrader';

export type Doelgroep = 'Tovedem' | 'Cloos' | 'Mejotos';

/** De invulbare velden van een gelezen stuk (zonder record-metadata). */
export interface GelezenStukVelden {
  titel: string;
  auteur: string;
  genre: string;
  /** Totaal aantal rollen in het stuk. */
  aantal_spelers: number;
  aantal_mannen: number;
  aantal_vrouwen: number;
  /** Rollen die door zowel een man als een vrouw gespeeld kunnen worden. */
  aantal_vrij: number;
  aantal_bedrijven: number | null;
  duur_minuten: number | null;
  /** Waardering van 1 t/m 5 sterren. */
  sterren: number;
  advies: LeesAdvies;
  geschikt_voor: Doelgroep[];
  samenvatting: string;
  opmerkingen: string;
  gelezen_door: string;
  gelezen_op: string;
}

/** Een toneelstuk dat door de lees commissie gelezen en beoordeeld is. */
export interface GelezenStuk extends BaseModel, GelezenStukVelden {
  created: string;
  updated: string;
}
