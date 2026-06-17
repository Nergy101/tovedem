export type NieuwsbriefBlokType =
  | 'koptekst'
  | 'alinea'
  | 'afbeelding'
  | 'evenement'
  | 'scheidingslijn'
  | 'knop';

export interface NieuwsbriefBlok {
  id: string;
  type: NieuwsbriefBlokType;
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
  // knop
  knop_label?: string;
  knop_url?: string;
}

export const BLOK_LABELS: Record<NieuwsbriefBlokType, string> = {
  koptekst: 'Koptekst',
  alinea: 'Alinea',
  afbeelding: 'Afbeelding',
  evenement: 'Evenement',
  scheidingslijn: 'Scheidingslijn',
  knop: 'Knop',
};

export const BLOK_ICONS: Record<NieuwsbriefBlokType, string> = {
  koptekst: 'title',
  alinea: 'subject',
  afbeelding: 'image',
  evenement: 'event',
  scheidingslijn: 'horizontal_rule',
  knop: 'smart_button',
};
