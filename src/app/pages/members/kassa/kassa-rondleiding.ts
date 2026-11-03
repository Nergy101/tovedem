import { LosseVerkoop } from '../../../models/domain/losse-verkoop.model';
import { Reservering } from '../../../models/domain/reservering.model';
import { Voorstelling } from '../../../models/domain/voorstelling.model';
import { RondleidingStap } from '../../../shared/services/rondleiding.service';

export const KASSA_RONDLEIDING_ID = 'kassa';

/** Prefix voor ids van voorbeeldgegevens; die worden nooit naar PocketBase gestuurd. */
export const VOORBEELD_ID_PREFIX = 'rondleiding-voorbeeld-';

export interface KassaRondleidingContext {
  /** Titel van de toekomstige voorstelling die voor de rondleiding geselecteerd is. */
  toekomstigeVoorstelling: string | null;
  /** True als (een deel van) de getoonde gegevens voorbeeldgegevens zijn. */
  voorbeeldGegevens: boolean;
}

export function getKassaRondleidingStappen(
  context: KassaRondleidingContext
): RondleidingStap[] {
  const stappen: RondleidingStap[] = [
    {
      titel: 'Welkom bij De Kassa',
      tekst:
        'Op deze pagina ontvang je bezoekers bij een voorstelling: je zoekt hun reservering op, vinkt aan wie er is, past reserveringen aan en houdt losse kaartverkoop bij. Deze rondleiding laat zien hoe dat werkt.',
    },
  ];

  if (context.toekomstigeVoorstelling || context.voorbeeldGegevens) {
    const uitleg: string[] = [];
    if (context.toekomstigeVoorstelling) {
      uitleg.push(
        `Vandaag is er geen voorstelling. Voor deze rondleiding is daarom de eerstvolgende voorstelling <strong>${context.toekomstigeVoorstelling}</strong> geselecteerd.`
      );
    } else if (context.voorbeeldGegevens) {
      uitleg.push(
        'Vandaag is er geen voorstelling. Voor deze rondleiding wordt daarom een voorbeeldvoorstelling getoond.'
      );
    }
    if (context.voorbeeldGegevens) {
      uitleg.push(
        'Waar nog geen gegevens zijn, zie je <strong>voorbeeldgegevens</strong>. Die worden niet opgeslagen en verdwijnen zodra de rondleiding klaar is.'
      );
    }
    stappen.push({
      titel: 'Voorbeeld voor deze rondleiding',
      tekst: uitleg.join('<br><br>'),
    });
  }

  stappen.push(
    {
      element: '#kassa-voorstelling',
      titel: 'De voorstelling',
      tekst:
        'Hier zie je voor welke voorstelling en speeldatum je de kassa doet. Een groene badge betekent dat de voorstelling vandaag is.',
      side: 'bottom',
    },
    {
      element: '.kassa-eerstvolgende-knop',
      titel: 'Eerstvolgende voorstelling',
      tekst:
        'Is er vandaag geen voorstelling? Met deze knop open je de kassa voor de eerstvolgende voorstelling, bijvoorbeeld om alvast voor te bereiden.',
      side: 'bottom',
    },
    {
      element: '#kassa-zoeken',
      titel: 'Reservering zoeken',
      tekst:
        'Staat er iemand aan de kassa? Typ (een deel van) de voornaam, achternaam of het e-mailadres om de reservering direct te vinden.',
      side: 'bottom',
    },
    {
      element: '#kassa-aanwezig-filter',
      titel: 'Filter op aanwezigheid',
      tekst:
        'Kies <strong>Niet aanwezig</strong> om alleen de bezoekers te zien die nog moeten komen, of <strong>Aanwezig</strong> voor wie er al is.',
      side: 'bottom',
    },
    {
      element: '#kassa-reserveringen',
      titel: 'De reserveringen',
      tekst:
        'Elke rij is één reservering: naam, e-mail, eventuele opmerking, het aantal kaartjes met het te betalen bedrag en of iemand vriend of lid is.',
      side: 'top',
    },
    {
      element: '#kassa-reserveringen tbody tr:first-child mat-checkbox',
      titel: 'Aanwezigheid afvinken',
      tekst:
        'Komt de bezoeker binnen? Vink dit vakje aan. De rij wordt gemarkeerd en de kaartjes tellen in de grafiek als <strong>Aanwezig</strong>. Per ongeluk aangevinkt? Klik nog een keer om het terug te zetten.',
      side: 'right',
    },
    {
      element: '#kassa-reserveringen .opmerking-button',
      titel: 'Opmerking bekijken',
      tekst:
        'Heeft een bezoeker iets bij de reservering gezet, zoals een rolstoel of een verzoek om vooraan te zitten? Klik hier om de opmerking te lezen.',
      side: 'left',
    },
    {
      element:
        '#kassa-reserveringen tbody tr:first-child button[aria-label="Bewerken"]',
      titel: 'Komen er minder (of meer) mensen?',
      tekst:
        'Klik op het potlood om de reservering aan te passen. Zet bij <strong>Tickets</strong> het aantal mensen dat echt komt en sla op. Het bedrag, de lijst en de grafiek worden meteen bijgewerkt.',
      side: 'left',
    },
    {
      element: '#kassa-losse-verkoop-knop',
      titel: 'Losse kaartverkoop',
      tekst:
        'Koopt iemand aan de deur kaartjes zonder reservering? Klik op <strong>Losse verkoop</strong>, vul het aantal kaartjes in en kies de speeldatum. Het bedrag wordt berekend met de kaartprijs van de voorstelling.',
      side: 'bottom',
    },
    {
      element: '#kassa-losse-verkoop',
      titel: 'Overzicht losse verkoop',
      tekst:
        'Alle losse verkopen van deze speeldatum met aantal en bedrag. Je kunt hier ook met <strong>Toevoegen</strong> een verkoop invoeren. Een foutje gemaakt? Verwijder de regel met het prullenbakje en voer hem opnieuw in.',
      side: 'top',
    },
    {
      element: '#kassa-bezetting',
      titel: 'Bezetting van de zaal',
      tekst:
        'De grafiek laat zien hoeveel stoelen bezet zijn door aanwezige bezoekers, losse verkoop en reserveringen die nog moeten komen, en hoeveel er nog vrij zijn.',
      side: 'top',
    },
    {
      element: '#kassa-rondleiding-knop',
      titel: 'Rondleiding opnieuw bekijken',
      tekst:
        'Deze rondleiding krijg je alleen bij je eerste bezoek. Wil je hem later nog eens zien, klik dan hier. Veel succes aan de kassa!',
      side: 'bottom',
    }
  );

  return stappen;
}

const metadata = (
  id: string,
  collectionName: string
): {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
} => ({
  id: VOORBEELD_ID_PREFIX + id,
  collectionId: 'rondleiding',
  collectionName,
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
});

export function maakVoorbeeldVoorstelling(): Voorstelling {
  const overEenWeek = new Date();
  overEenWeek.setDate(overEenWeek.getDate() + 7);
  overEenWeek.setHours(20, 0, 0, 0);

  return {
    ...metadata('voorstelling', 'voorstellingen'),
    groep: '',
    titel: 'Voorbeeldvoorstelling',
    regie: '',
    omschrijving: '',
    datum_tijd_1: overEenWeek.toISOString(),
    beschikbare_stoelen_datum_tijd_1: 120,
    beschikbare_stoelen_datum_tijd_2: 0,
    publicatie_datum: '',
    prijs_per_kaartje: 12.5,
  };
}

export function maakVoorbeeldReserveringen(
  voorstelling: Voorstelling,
  dag: 'datum1' | 'datum2'
): Reservering[] {
  const personen: [string, string, number, boolean, string][] = [
    ['Anna', 'de Boer', 2, true, ''],
    ['Pieter', 'Visser', 4, false, 'Graag vooraan, mijn moeder is slecht ter been.'],
    ['Sanne', 'Mulder', 1, false, ''],
    ['Jeroen', 'Smit', 3, false, ''],
  ];

  return personen.map(([voornaam, achternaam, aantal, aanwezig, opmerking], i) => ({
    ...metadata(`reservering-${i}`, 'reserveringen'),
    email: `${voornaam.toLowerCase()}@voorbeeld.nl`,
    voornaam,
    achternaam,
    is_vriend_van_tovedem: i === 1,
    is_lid_van_vereniging: false,
    voorstelling: voorstelling.id,
    datum_tijd_1_aantal: dag === 'datum1' ? aantal : 0,
    datum_tijd_2_aantal: dag === 'datum2' ? aantal : 0,
    opmerking,
    guid: '',
    aanwezig_datum_1: dag === 'datum1' && aanwezig,
    aanwezig_datum_2: dag === 'datum2' && aanwezig,
  }));
}

export function maakVoorbeeldLosseVerkoop(
  voorstelling: Voorstelling,
  dag: 'datum1' | 'datum2'
): LosseVerkoop[] {
  return [
    {
      ...metadata('losse-verkoop', 'losse_verkoop'),
      aantal: 2,
      voorstelling: voorstelling.id,
      datum: dag,
    },
  ];
}
