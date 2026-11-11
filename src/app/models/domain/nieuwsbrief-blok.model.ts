export type NieuwsbriefBlokType =
  | 'koptekst'
  | 'alinea'
  | 'afbeelding'
  | 'evenement'
  | 'voorstelling'
  | 'scheidingslijn'
  | 'knop';

export type NieuwsbriefUitlijning = 'links' | 'midden' | 'rechts';

export interface NieuwsbriefBlok {
  id: string;
  type: NieuwsbriefBlokType;
  /** Leeg = standaard uitlijning van het bloktype (zie STANDAARD_UITLIJNING). */
  uitlijning?: NieuwsbriefUitlijning;
  // koptekst
  titel?: string;
  ondertitel?: string;
  // alinea
  tekst?: string;
  // afbeelding
  afbeelding_url?: string;
  afbeelding_alt?: string;
  onderschrift?: string;
  // evenement
  event_titel?: string;
  event_datum?: string;
  event_locatie?: string;
  event_prijs?: string;
  event_link?: string;
  // voorstelling: momentopname van de voorstelling bij het kiezen, zodat de mail
  // er hetzelfde uitziet als het voorbeeld (ook als de voorstelling later wijzigt)
  voorstelling_id?: string;
  voorstelling_titel?: string;
  voorstelling_ondertitel?: string;
  voorstelling_omschrijving?: string;
  voorstelling_regie?: string;
  voorstelling_prijs?: number | null;
  voorstelling_afbeelding_url?: string;
  /** Speeldata, al opgemaakt, bijv. "vrijdag 13 maart 2026 · 20:00". */
  voorstelling_datums?: string[];
  voorstelling_reserveer_url?: string;
  toon_ondertitel?: boolean;
  toon_omschrijving?: boolean;
  toon_prijs?: boolean;
  toon_regie?: boolean;
  // knop
  knop_label?: string;
  knop_url?: string;
}

export const BLOK_LABELS: Record<NieuwsbriefBlokType, string> = {
  koptekst: 'Koptekst',
  alinea: 'Alinea',
  afbeelding: 'Afbeelding',
  evenement: 'Evenement',
  voorstelling: 'Voorstelling',
  scheidingslijn: 'Scheidingslijn',
  knop: 'Knop',
};

export const BLOK_ICONS: Record<NieuwsbriefBlokType, string> = {
  koptekst: 'title',
  alinea: 'subject',
  afbeelding: 'image',
  evenement: 'event',
  voorstelling: 'theater_comedy',
  scheidingslijn: 'horizontal_rule',
  knop: 'smart_button',
};

export const STANDAARD_UITLIJNING: Record<NieuwsbriefBlokType, NieuwsbriefUitlijning> = {
  koptekst: 'midden',
  alinea: 'links',
  afbeelding: 'midden',
  evenement: 'links',
  voorstelling: 'midden',
  scheidingslijn: 'midden',
  knop: 'midden',
};

export function uitlijningVan(blok: NieuwsbriefBlok): NieuwsbriefUitlijning {
  return blok.uitlijning ?? STANDAARD_UITLIJNING[blok.type];
}
