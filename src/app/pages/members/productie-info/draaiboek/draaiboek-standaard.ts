import {
  DraaiboekGroep,
  DraaiboekInhoud,
  DraaiboekItem,
} from '../../../../models/domain/draaiboek.model';

/*
 * Standaard (concept) draaiboeken, uitgewerkt uit draaiboeken van eerdere producties.
 * Bewust zonder persoonsnamen of telefoonnummers: alleen rollen.
 * Wordt getoond zolang er voor een groep nog geen draaiboek in PocketBase is opgeslagen.
 */

function item(
  tijd: string,
  actie: string,
  door: string[] = [],
  extra: Partial<DraaiboekItem> = {}
): DraaiboekItem {
  return { tijd, actie, door, ...extra };
}

const SCHALM_REGELS = {
  titel: 'Algemene regels',
  punten: [
    'Gedraag je als gast in De Schalm, dus rustig in de gang!',
    'Ruim al je spullen netjes op. We zitten met heel veel mensen in een kleine ruimte.',
    'Wees op tijd aanwezig, zie de tijden in dit draaiboek.',
    'Ruim na de voorstelling je spullen op. Na de laatste voorstelling neem je al je spullen mee en help je met opruimen.',
  ],
};

const TOVEDEM_AVOND: DraaiboekItem[] = [
  item('15:00', 'Cast komt binnendruppelen en richt de kleedkamer (zaal 4) in', ['Spelers', 'Regie']),
  item('15:00', 'Grime aanwezig', ['Grime']),
  item('18:00', 'Eten (zelf meenemen of laten halen)', ['Spelers', 'Regie', 'Grime']),
  item('18:45', 'Coördinatie aanwezig', ['Coördinatie'], { belangrijk: true }),
  item('19:00', 'Ondersteunende leden aanwezig: taken doorspreken', ['Ondersteunende leden', 'Coördinatie'], { belangrijk: true }),
  item('19:00', 'Fotograaf aanwezig (één van beide avonden)', ['Fotograaf']),
  item('19:15', 'Posten bezetten', ['Ondersteunende leden'], {
    belangrijk: true,
    notitie: 'Verdeling van de posten hieronder gebeurt door de coördinatie.',
  }),
  item('', 'Cake snijden en op de bar zetten', ['Ondersteunende leden']),
  item('', 'Kassa', ['Kassa & reserveringen']),
  item('', '"Gereserveerd"-kaartjes klaarleggen', ['Kassa & reserveringen']),
  item('', 'Bardienst: bediening achter de bar in de pauze en na afloop', ['Bardienst']),
  item('', 'Glaswerk en kopjes opruimen bij de bar (vooraf en na de pauze)', ['Ondersteunende leden']),
  item('', 'Zaalhulp', ['Zaalhulp']),
  item('', 'Deurwacht', ['Deurwacht']),
  item('', 'Drankverzorging spelers, de hele avond', ['Ondersteunende leden']),
  item('20:00', 'Aankondiging', ['Presentatie']),
  item('20:05', 'Start voorstelling', ['Spelers', 'Regie'], { belangrijk: true }),
  item('20:45', 'Pauze', ['Bardienst']),
  item('', 'Glaswerk en kopjes opruimen bij de bar', ['Ondersteunende leden']),
  item('21:15', 'Tweede akte', ['Spelers']),
  item('22:00', 'Nootjes op tafels', ['Barmedewerkers De Schalm']),
  item('22:00', 'Afkondiging', ['Presentatie']),
  item('', 'Bloemen: een bos voor de regie, een roos voor de spelers en grime', ['Ondersteunende leden']),
  item('', 'Bardienst na afloop, achter de bar in overleg met De Schalm', ['Bardienst']),
  item('22:30', 'Borrelhapjes klaarmaken', ['Barmedewerkers De Schalm']),
  item('22:45', 'Rondgaan met borrelhapjes', ['Ondersteunende leden']),
];

const TOVEDEM: DraaiboekInhoud = {
  titel: 'Draaiboek avondvoorstelling Tovedem',
  intro:
    'Tovedem speelt twee avondvullende voorstellingen in De Schalm, meestal op vrijdag en zaterdag. Zo ziet een normale productieweek er ongeveer uit. De tijden zijn richttijden.',
  rollen: [
    { rol: 'Regie', omschrijving: 'Leidt de voorstelling en is het aanspreekpunt voor de spelers.' },
    { rol: 'Spelers', omschrijving: 'De cast van de voorstelling, soms aangevuld met een gastrol.' },
    { rol: 'Coördinatie', omschrijving: 'Aanspreekpunt van de avond (per avond iemand anders) en verdeelt de taken onder de ondersteunende leden.' },
    { rol: 'Ondersteunende leden', omschrijving: "Niet-spelende leden van Tovedem, Mejoto's 3, Cloos en de Mejoto-begeleiders. Zij bemannen de bar, zaal, deur en helpen de spelers." },
    { rol: 'Kassa & reserveringen', omschrijving: 'Kaartverkoop aan de kassa en het klaarleggen van gereserveerde kaarten.' },
    { rol: 'Bardienst', omschrijving: 'Helpt achter de bar in de pauze en na afloop, in overleg met De Schalm.' },
    { rol: 'Zaalhulp', omschrijving: 'Helpt het publiek aan een plek en houdt de zaal overzichtelijk.' },
    { rol: 'Deurwacht', omschrijving: 'Ontvangt het publiek bij de deur.' },
    { rol: 'Presentatie', omschrijving: 'Verzorgt de aankondiging en afkondiging.' },
    { rol: 'Grime', omschrijving: 'Schminkt en kapt de spelers voor de voorstelling.' },
    { rol: 'Decorploeg', omschrijving: 'Bouwt het decor op en breekt het na de laatste voorstelling weer af.' },
    { rol: 'Licht & geluid', omschrijving: 'Verzorgd door Auvitech, inclusief het uitlichten met de regie.' },
    { rol: 'Fotograaf', omschrijving: 'Maakt foto\'s van één van de voorstellingen; die komen later in de galerij.' },
    { rol: 'Barmedewerkers De Schalm', omschrijving: 'Het vaste barpersoneel van De Schalm.' },
  ],
  secties: [
    {
      titel: 'Afspraken met De Schalm',
      punten: [
        'De spelende leden en de regie krijgen beide avonden één drankje bij het eten, op rekening van Tovedem.',
        'Nootjes op de bar en de tafels.',
        'Per avond een bittergarnituur.',
        'Zo nodig wordt de zaal na afloop omgebouwd, in overleg met de beheerders van De Schalm.',
        'Kaartverkoop in De Schalm tijdens kantooruren.',
        'De ondersteunende leden krijgen per avond een munt voor koffie of thee.',
        'Stem met elkaar en met De Schalm af hoeveel hulp er achter de bar nodig is.',
      ],
    },
    {
      titel: 'Opruimen na de laatste voorstelling',
      punten: [
        'Het podium is leeg.',
        'Zaal 4 is leeg, de vloer is veegschoon en de grimekast is schoongemaakt.',
        'Alle kleding, rekwisieten en decorstukken die niet van De Schalm zijn, verlaten het pand (in overleg met De Schalm op zaterdagavond of zondagochtend).',
      ],
    },
  ],
  dagen: [
    {
      naam: 'Opbouw',
      omschrijving: 'Zondag voor de voorstellingen',
      items: [
        item('09:00', 'Decor opbouwen (tot ongeveer 13:00)', ['Decorploeg', 'Spelers', 'Ondersteunende leden'], {
          notitie: 'Hulp vanuit de cast en de leden is welkom.',
        }),
        item('', 'Uitlichten van de voorstelling', ['Licht & geluid', 'Regie']),
      ],
    },
    {
      naam: 'Generale repetitie',
      omschrijving: 'Donderdag',
      items: [
        item('20:00', 'Generale repetitie', ['Spelers', 'Regie', 'Licht & geluid'], { belangrijk: true }),
      ],
    },
    {
      naam: 'Première',
      omschrijving: 'Vrijdag',
      items: [
        ...TOVEDEM_AVOND,
        item('23:45', 'Laatste ronde', ['Barmedewerkers De Schalm']),
        item('00:00', 'Sluiting De Schalm', ['Barmedewerkers De Schalm']),
      ],
    },
    {
      naam: 'Tweede voorstelling',
      omschrijving: 'Zaterdag',
      items: [
        ...TOVEDEM_AVOND,
        item('23:00', 'Decor afbreken', ['Decorploeg', 'Spelers'], {
          belangrijk: true,
          notitie: 'Zie "Opruimen na de laatste voorstelling".',
        }),
        item('23:45', 'Laatste ronde', ['Barmedewerkers De Schalm']),
        item('00:00', 'Sluiting De Schalm', ['Barmedewerkers De Schalm']),
        item('', 'Nakletsen met een drankje en een hapje'),
      ],
    },
  ],
};

const CLOOS_POSTEN = (tijd: string): DraaiboekItem[] => [
  item(tijd, 'Zaalhulp', ['Hulptroepen']),
  item('', 'Extra hulp achter de bar (indien nodig)', ['Hulptroepen']),
  item('', 'Kaartverkoop', ['Hulptroepen']),
  item('', 'Drankverzorging spelers', ['Hulptroepen']),
  item('', 'Stoelen reserveren voor jeugd en donateurs', ['Hulptroepen']),
];

const CLOOS: DraaiboekInhoud = {
  titel: 'Draaiboek Cloos',
  intro:
    'Cloos speelt een avondvoorstelling op zaterdag en een middagvoorstelling op zondag in De Schalm. In de dagen ervoor zijn de technische doorloop en de generale repetitie. De tijden zijn richttijden.',
  rollen: [
    { rol: 'Algemene coördinatie', omschrijving: 'Aanspreekpunt tijdens het weekend en instrueert de hulptroepen.' },
    { rol: 'Regie', omschrijving: 'Begeleidt de spelers van Cloos tijdens doorloop, generale en voorstellingen.' },
    { rol: 'Cloos', omschrijving: 'De spelers. Zij verzorgen ook samen de maaltijd en ruimen zaal 4 op.' },
    { rol: 'Presentatie', omschrijving: 'Verzorgt het welkomstwoord, de aankondiging en de afkondiging.' },
    { rol: 'Hulptroepen', omschrijving: 'Vrijwilligers voor zaalhulp, bar, kaartverkoop, drankverzorging spelers, stoelen reserveren en bloemen.' },
    { rol: 'Bardienst', omschrijving: 'Bediening achter de bar in de pauze.' },
    { rol: 'Grime', omschrijving: 'Schminkt en kapt de spelers.' },
    { rol: 'Decorploeg', omschrijving: 'Decor opbouwen en het toneel na de laatste voorstelling leeg opleveren.' },
    { rol: 'Licht & geluid', omschrijving: 'Verzorgd door Auvitech, inclusief muziek bij zaal open en na afloop.' },
    { rol: 'Fotograaf', omschrijving: "Maakt foto's van de voorstelling voor de galerij." },
  ],
  secties: [SCHALM_REGELS],
  dagen: [
    {
      naam: 'Technische doorloop',
      omschrijving: 'Donderdag',
      items: [
        item('20:00', 'Aanwezig', ['Cloos', 'Regie', 'Licht & geluid']),
        item('20:05', 'Start technische doorloop', ['Cloos', 'Regie', 'Licht & geluid'], { belangrijk: true }),
      ],
    },
    {
      naam: 'Generale repetitie',
      omschrijving: 'Vrijdag',
      items: [
        item('20:00', 'Aanwezig', ['Cloos', 'Regie']),
        item('20:15', 'Start generale repetitie', ['Cloos', 'Regie'], { belangrijk: true }),
      ],
    },
    {
      naam: 'Avondvoorstelling',
      omschrijving: 'Zaterdag',
      items: [
        item('13:00', 'Aanwezig', ['Cloos', 'Regie']),
        item('', 'Licht & geluid aanwezig (tijd in overleg)', ['Licht & geluid']),
        item('15:00', 'Grime aanwezig', ['Grime']),
        item('17:15', 'Klaarmaken voor het avondeten', ['Iedereen']),
        item('17:30', 'Gezamenlijke maaltijd', ['Iedereen']),
        item('', 'Dranklijstjes voor na de voorstelling', ['Algemene coördinatie']),
        item('18:15', 'Grime check', ['Grime', 'Cloos']),
        item('19:00', 'Koffie, hulptroepen instrueren', ['Algemene coördinatie', 'Hulptroepen'], { belangrijk: true }),
        item('19:10', 'Cake snijden en op tafels zetten', ['Hulptroepen']),
        ...CLOOS_POSTEN('19:15'),
        item('19:30', 'Start muziek, zaal open', ['Licht & geluid']),
        item('19:55', 'Alles klaar!', ['Cloos', 'Regie', 'Grime', 'Licht & geluid', 'Decorploeg'], { belangrijk: true }),
        item('20:00', 'Welkomstwoord', ['Presentatie']),
        item('20:05', 'Start voorstelling', ['Cloos'], { belangrijk: true }),
        item('20:45', 'Pauze', ['Bardienst']),
        item('21:10', 'Zaal open voor het tweede bedrijf', ['Hulptroepen']),
        item('21:15', 'Start tweede bedrijf', ['Cloos']),
        item('22:00', 'Afkondiging', ['Presentatie']),
        item('', 'Bloemen', ['Hulptroepen']),
        item('', 'Muziek', ['Licht & geluid']),
        item('', 'Bittergarnituur', ['Hulptroepen']),
        item('23:45', 'Laatste ronde'),
        item('00:00', 'Sluiten'),
      ],
    },
    {
      naam: 'Middagvoorstelling',
      omschrijving: 'Zondag',
      items: [
        item('10:30', 'Aanwezig en naar de grime', ['Cloos', 'Regie', 'Grime']),
        item('12:30', 'Aanwezig', ['Licht & geluid', 'Decorploeg']),
        item('', 'Koffie, hulptroepen instrueren', ['Algemene coördinatie', 'Hulptroepen'], { belangrijk: true }),
        ...CLOOS_POSTEN('12:45'),
        item('13:00', 'Start muziek, zaal open', ['Licht & geluid']),
        item('13:30', 'Aankondiging', ['Presentatie']),
        item('13:35', 'Start voorstelling', ['Cloos'], { belangrijk: true }),
        item('14:15', 'Pauze', ['Bardienst']),
        item('14:40', 'Zaal open voor het tweede bedrijf', ['Hulptroepen']),
        item('14:45', 'Start tweede bedrijf', ['Cloos']),
        item('15:30', 'Afkondiging', ['Presentatie']),
        item('', 'Bloemen', ['Hulptroepen']),
        item('', 'Extra hulp achter de bar (indien nodig)', ['Hulptroepen']),
        item('', 'Muziek', ['Licht & geluid']),
        item('', 'Bitterballen', ['Hulptroepen']),
        item('17:00', 'Het hele toneel leeg opleveren', ['Decorploeg', 'Cloos'], { belangrijk: true }),
        item('', 'Zaal 4 leeg en schoon', ['Cloos'], { belangrijk: true }),
        item('18:15', 'Laatste ronde'),
        item('18:30', 'Sluiting'),
      ],
    },
  ],
};

const MEJOTOS_POSTEN = (tijd: string): DraaiboekItem[] => [
  item(tijd, 'Zaalhulp', ['Hulptroepen']),
  item('', 'Extra hulp achter de bar', ['Hulptroepen']),
  item('', 'Gangbezetting', ['Hulptroepen']),
  item('', 'Kaartverkoop', ['Hulptroepen']),
  item('', 'Drankverzorging spelers', ['Hulptroepen']),
  item('', 'Stoelen reserveren voor jeugd en donateurs', ['Hulptroepen']),
];

const mejotosBlok = (
  groep: string,
  aankondiging: string,
  start: string,
  afkondiging: string,
  welkom = false
): DraaiboekItem[] => [
  item(aankondiging, welkom ? 'Welkomstwoord' : 'Aankondiging', ['Presentatie']),
  item(start, `Start ${groep}`, [groep], { belangrijk: true }),
  item(afkondiging, 'Afkondiging en pauze', ['Presentatie']),
];

const MEJOTOS: DraaiboekInhoud = {
  titel: "Draaiboek Mejoto's",
  intro:
    "De drie jeugdgroepen (Mejoto's 1, 2 en 3) spelen elk een eigen voorstelling van ongeveer een half uur, op zaterdagavond en zondagmiddag in De Schalm. De tijden zijn richttijden.",
  rollen: [
    { rol: 'Algemene coördinatie', omschrijving: 'Aanspreekpunt tijdens het weekend en instrueert de hulptroepen.' },
    { rol: 'Begeleiding', omschrijving: 'De regisseurs en begeleiders van de groepen. Zij zijn de hele dag bij hun groep.' },
    { rol: "Mejoto's 1", omschrijving: 'Jongste groep, met een eigen voorstelling.' },
    { rol: "Mejoto's 2", omschrijving: 'Middelste groep, met een eigen voorstelling.' },
    { rol: "Mejoto's 3", omschrijving: 'Oudste groep, met een eigen voorstelling.' },
    { rol: 'Presentatie', omschrijving: 'Welkomstwoord, aankondigingen en afkondigingen tussen de voorstellingen.' },
    { rol: 'Hulptroepen', omschrijving: 'Vrijwilligers voor zaalhulp, bar, gang, kaartverkoop, drankverzorging spelers en stoelen reserveren.' },
    { rol: 'Broodmaaltijd', omschrijving: 'Hulp vanuit Tovedem die de broodmaaltijd klaarzet.' },
    { rol: 'Grime', omschrijving: 'Schminkt en kapt de spelers, groep voor groep.' },
    { rol: 'Decorploeg', omschrijving: 'Decor opbouwen en het toneel na afloop leeg opleveren.' },
    { rol: 'Licht & geluid', omschrijving: 'Verzorgd door Auvitech, ook bij de doorlopen per groep.' },
    { rol: 'Fotograaf', omschrijving: "Maakt foto's van de voorstellingen voor de galerij." },
  ],
  secties: [
    {
      ...SCHALM_REGELS,
      punten: [
        ...SCHALM_REGELS.punten,
        'Op zondag ruimen we samen alles op en maken we schoon.',
      ],
    },
  ],
  dagen: [
    {
      naam: 'Zaterdag',
      omschrijving: 'Doorlopen en avondvoorstelling',
      items: [
        item('11:00', 'Aanwezig', ['Decorploeg', 'Begeleiding']),
        item('11:45', 'Aanwezig', ["Mejoto's 3"]),
        item('12:00', "Doorloop Mejoto's 3", ["Mejoto's 3", 'Licht & geluid']),
        item('12:45', 'Aanwezig', ["Mejoto's 1"]),
        item('13:00', 'Naar de grime', ["Mejoto's 1", 'Grime']),
        item('13:30', 'Aanwezig', ["Mejoto's 2"]),
        item('13:45', "Doorloop Mejoto's 2", ["Mejoto's 2", 'Licht & geluid']),
        item('15:00', 'Naar de grime', ["Mejoto's 3", 'Grime']),
        item('15:30', "Doorloop Mejoto's 1", ["Mejoto's 1", 'Licht & geluid']),
        item('16:00', 'Naar de grime', ["Mejoto's 2", 'Grime']),
        item('16:45', 'Maaltijd klaarzetten', ['Broodmaaltijd']),
        item('17:15', 'Klaarmaken voor de broodmaaltijd', ['Iedereen']),
        item('17:30', 'Gezamenlijke maaltijd', ['Iedereen']),
        item('', 'Dranklijstjes voor na de voorstelling', ['Begeleiding']),
        item('18:15', 'Grime voor wie nog niet geweest is', ['Grime']),
        item('18:30', 'Hulptroepen aanwezig en instrueren', ['Algemene coördinatie', 'Hulptroepen'], { belangrijk: true }),
        item('18:40', 'Cake snijden en op tafels zetten', ['Hulptroepen']),
        ...MEJOTOS_POSTEN('18:45'),
        item('19:00', 'Start muziek, zaal open', ['Licht & geluid']),
        item('19:25', 'Alles klaar!', ['Iedereen', 'Begeleiding', 'Grime', 'Licht & geluid', 'Decorploeg'], { belangrijk: true }),
        ...mejotosBlok("Mejoto's 1", '19:30', '19:35', '20:05', true),
        ...mejotosBlok("Mejoto's 2", '20:25', '20:30', '21:00'),
        ...mejotosBlok("Mejoto's 3", '21:20', '21:25', '21:55'),
        item('', 'Muziek', ['Licht & geluid']),
        item('', 'Bittergarnituur', ['Hulptroepen']),
        item('23:15', 'Laatste ronde'),
        item('23:30', 'Sluiten'),
      ],
    },
    {
      naam: 'Zondag',
      omschrijving: 'Middagvoorstelling en opruimen',
      items: [
        item('09:30', 'Aanwezig en cake snijden', ['Begeleiding']),
        item('', 'Aanwezig en naar de grime', ["Mejoto's 3", 'Grime']),
        item('10:30', 'Aanwezig en naar de grime', ["Mejoto's 2"]),
        item('12:30', 'Aanwezig en naar de grime', ["Mejoto's 1", 'Licht & geluid', 'Decorploeg']),
        item('', 'Hulptroepen aanwezig en instrueren', ['Algemene coördinatie', 'Hulptroepen'], { belangrijk: true }),
        ...MEJOTOS_POSTEN('12:45'),
        item('13:00', 'Start (kerst)muziek, zaal open', ['Licht & geluid']),
        ...mejotosBlok("Mejoto's 3", '13:30', '13:35', '14:05'),
        ...mejotosBlok("Mejoto's 2", '14:25', '14:30', '15:00'),
        ...mejotosBlok("Mejoto's 1", '15:20', '15:25', '15:55'),
        item('', 'Start muziek', ['Licht & geluid']),
        item('17:00', 'Het hele toneel leeg opleveren', ['Decorploeg', 'Begeleiding'], { belangrijk: true }),
        item('', 'Grote kelder leeg en schoon', ["Mejoto's 1", 'Begeleiding'], { belangrijk: true }),
        item('', 'Kleine kelder leeg en schoon', ["Mejoto's 2", 'Begeleiding'], { belangrijk: true }),
        item('', 'Zaal 4 leeg en schoon', ["Mejoto's 3", 'Begeleiding'], { belangrijk: true }),
        item('18:15', 'Laatste ronde'),
        item('18:30', 'Sluiting'),
      ],
    },
  ],
};

export const STANDAARD_DRAAIBOEKEN: Record<DraaiboekGroep, DraaiboekInhoud> = {
  Tovedem: TOVEDEM,
  Cloos: CLOOS,
  Mejotos: MEJOTOS,
};
