import { Injectable } from '@angular/core';
import {
  GelezenStuk,
  GelezenStukVelden,
} from '../../../models/domain/gelezen-stuk.model';

export type GelezenStukInvoer = GelezenStukVelden;

const STORAGE_KEY = 'lees-commissie-stukken';

/**
 * DUMMY-opslag voor de lees commissie: bewaart gelezen stukken in localStorage
 * van deze browser. De methodes zijn async, zodat ze later één-op-één vervangen
 * kunnen worden door een PocketBase collectie `gelezen_stukken`.
 */
@Injectable({
  providedIn: 'root',
})
export class LeesCommissieService {
  async getAll(): Promise<GelezenStuk[]> {
    return this.lees();
  }

  async create(invoer: GelezenStukInvoer): Promise<GelezenStuk> {
    const nu = new Date().toISOString();
    const stuk: GelezenStuk = {
      ...invoer,
      id: crypto.randomUUID(),
      collectionId: 'dummy',
      collectionName: 'gelezen_stukken',
      created: nu,
      updated: nu,
    };
    this.schrijf([stuk, ...this.lees()]);
    return stuk;
  }

  async update(id: string, invoer: GelezenStukInvoer): Promise<GelezenStuk> {
    const stukken = this.lees();
    const bestaand = stukken.find((s) => s.id === id);
    if (!bestaand) throw new Error(`Gelezen stuk ${id} niet gevonden`);

    const bijgewerkt: GelezenStuk = {
      ...bestaand,
      ...invoer,
      updated: new Date().toISOString(),
    };
    this.schrijf(stukken.map((s) => (s.id === id ? bijgewerkt : s)));
    return bijgewerkt;
  }

  async delete(id: string): Promise<void> {
    this.schrijf(this.lees().filter((s) => s.id !== id));
  }

  private lees(): GelezenStuk[] {
    try {
      const opgeslagen = localStorage.getItem(STORAGE_KEY);
      if (opgeslagen === null) {
        // Eerste bezoek: voorbeeldgegevens tonen zodat de pagina niet leeg is
        this.schrijf(VOORBEELD_STUKKEN);
        return [...VOORBEELD_STUKKEN];
      }
      return JSON.parse(opgeslagen) as GelezenStuk[];
    } catch {
      return [];
    }
  }

  private schrijf(stukken: GelezenStuk[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stukken));
    } catch {
      // localStorage niet beschikbaar: wijzigingen gaan verloren bij herladen
    }
  }
}

const voorbeeld = (id: string, stuk: GelezenStukVelden): GelezenStuk => ({
  ...stuk,
  id,
  collectionId: 'dummy',
  collectionName: 'gelezen_stukken',
  created: stuk.gelezen_op,
  updated: stuk.gelezen_op,
});

const VOORBEELD_STUKKEN: GelezenStuk[] = [
  voorbeeld('voorbeeld-1', {
    titel: 'Het Verloren Testament',
    auteur: 'J. de Vries',
    genre: 'Komedie',
    aantal_spelers: 8,
    aantal_mannen: 3,
    aantal_vrouwen: 4,
    aantal_vrij: 1,
    aantal_bedrijven: 3,
    duur_minuten: 120,
    sterren: 4,
    advies: 'aanrader',
    geschikt_voor: ['Tovedem'],
    samenvatting:
      'Een familie komt bijeen voor het voorlezen van het testament van een rijke oom, maar het testament is spoorloos. Iedereen verdenkt iedereen.',
    opmerkingen:
      'Veel snelle dialogen en een mooie rol voor een oudere speler. Decor is één woonkamer, dus goed te doen.',
    gelezen_door: 'Voorbeeld',
    gelezen_op: '2026-09-14T10:00:00.000Z',
  }),
  voorbeeld('voorbeeld-2', {
    titel: 'Storm op het Eiland',
    auteur: 'M. Jansen',
    genre: 'Avontuur',
    aantal_spelers: 12,
    aantal_mannen: 2,
    aantal_vrouwen: 2,
    aantal_vrij: 8,
    aantal_bedrijven: 2,
    duur_minuten: 75,
    sterren: 3,
    advies: 'misschien',
    geschikt_voor: ['Cloos', 'Mejotos'],
    samenvatting:
      'Een groep kinderen strandt na een storm op een onbewoond eiland en moet samenwerken om terug te komen.',
    opmerkingen:
      'Leuk voor de jeugd, maar het tweede bedrijf is wat lang. Zou ingekort kunnen worden.',
    gelezen_door: 'Voorbeeld',
    gelezen_op: '2026-08-30T10:00:00.000Z',
  }),
  voorbeeld('voorbeeld-3', {
    titel: 'Diner voor Twee',
    auteur: 'A. Bakker',
    genre: 'Drama',
    aantal_spelers: 4,
    aantal_mannen: 2,
    aantal_vrouwen: 2,
    aantal_vrij: 0,
    aantal_bedrijven: 1,
    duur_minuten: 90,
    sterren: 2,
    advies: 'afrader',
    geschikt_voor: ['Tovedem'],
    samenvatting:
      'Twee stellen ontmoeten elkaar voor een etentje dat steeds verder uit de hand loopt.',
    opmerkingen: 'Te weinig rollen voor onze groep en vrij zwaar van toon.',
    gelezen_door: 'Voorbeeld',
    gelezen_op: '2026-07-02T10:00:00.000Z',
  }),
];
