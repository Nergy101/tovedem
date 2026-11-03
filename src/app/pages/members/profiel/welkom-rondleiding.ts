import { AuthService } from '../../../shared/services/auth.service';
import { RondleidingStap } from '../../../shared/services/rondleiding.service';

export const WELKOM_RONDLEIDING_ID = 'welkom';

const sidebar = (sleutel: string): string => `[data-rondleiding="${sleutel}"]`;

export interface ZijmenuBediening {
  /** Opent het zijmenu (en wacht tot de animatie klaar is). */
  open: () => Promise<void>;
  /** Zet het zijmenu terug zoals het voor de rondleiding was. */
  herstel: () => Promise<void>;
}

/**
 * Stappen voor de rondleiding op de startpagina na het inloggen.
 * De sidebar-stappen volgen dezelfde toegangsregels als de sidebar zelf: knoppen
 * die de gebruiker niet ziet, worden door de RondleidingService overgeslagen.
 * Waar wat je kunt doen per rol verschilt, past de tekst zich aan.
 */
export function getWelkomRondleidingStappen(
  authService: AuthService,
  zijmenu: ZijmenuBediening
): RondleidingStap[] {
  const heeftRol = (...rollen: string[]): boolean =>
    authService.isGlobalAdmin || authService.userHasAnyRole(rollen);

  const galerijTekst = [
    heeftRol('admin', 'bestuur', 'beheer')
      ? 'Bekijk en download de foto\'s van alle voorstellingen.'
      : 'Bekijk en download de foto\'s van de voorstellingen waaraan je gekoppeld bent. Mis je een album? Vraag het bestuur om je eraan te koppelen.',
    heeftRol('admin', 'commissie')
      ? 'Jij kunt in een album ook foto\'s uploaden en verwijderen.'
      : '',
    heeftRol('admin') ? 'Als admin kun je ook nieuwe albums aanmaken en verwijderen.' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const stappen: RondleidingStap[] = [
    {
      titel: 'Welkom bij het ledengedeelte',
      tekst:
        'Dit is je persoonlijke startpagina. In deze korte rondleiding zie je wat je hier vindt en welke onderdelen je via het zijmenu kunt openen. Je kunt de rondleiding op elk moment overslaan.',
    },
    {
      element: '#welkom-snelkoppelingen',
      titel: 'Snel naar',
      tekst:
        'De pagina\'s die jij het meest gebruikt, met één klik bereikbaar. Je ziet hier alleen wat bij jouw rollen hoort.',
      side: 'bottom',
    },
    {
      element: '#welkom-nieuws',
      titel: 'Laatste nieuws',
      tekst:
        'Het nieuws dat nu op de website staat. Klik op <strong>Lees verder</strong> om een bericht helemaal te lezen.',
      side: 'top',
    },
    {
      element: '#welkom-reserveringen',
      titel: 'Jouw reserveringen',
      tekst:
        'Hier zie je de reserveringen die met jouw e-mailadres gemaakt zijn. Met <strong>Aanpassen</strong> wijzig je het aantal kaartjes.',
      side: 'top',
    },
    {
      element: '#welkom-gegevens',
      titel: 'Jouw gegevens',
      tekst:
        'Bekijk met welke naam, e-mail, rollen en groep je bent ingeschreven. Klopt er iets niet? Neem contact op met het bestuur.',
      side: 'top',
    },
    {
      element: sidebar('sidebar-knop'),
      titel: 'Het zijmenu',
      tekst:
        'Met deze knop open en sluit je het zijmenu. Daarin staan alle onderdelen van het ledengedeelte waar jij toegang toe hebt. Die lopen we nu langs.',
      side: 'bottom',
    },

    // Productie informatie
    {
      element: sidebar('sectie-productie-info'),
      titel: 'Productie informatie',
      tekst:
        'Per groep (Tovedem, Cloos en Mejoto\'s) zie je wie er meespelen, wat de aankomende voorstelling is en welke voorstellingen al geweest zijn.',
      side: 'right',
    },

    // Commissies
    {
      element: sidebar('commissie-sinterklaas'),
      titel: 'Sinterklaas commissie',
      tekst:
        'Hier komen de Sinterklaasverzoeken binnen die via de website zijn ingestuurd. Je kunt ze bekijken, inplannen, de status bijwerken en verwijderen.',
      side: 'right',
    },
    {
      element: sidebar('lees-commissie'),
      titel: 'Lees commissie',
      tekst:
        'Houd bij welke toneelstukken je gelezen hebt: geef sterren, noteer hoeveel (mannen- en vrouwen)rollen erin zitten, de speelduur en voor welke groep het geschikt is. Met filters vind je snel een stuk dat bij de groep past.',
      side: 'right',
    },
    {
      element: sidebar('beheer-nieuws'),
      titel: 'Nieuws commissie',
      tekst:
        'Schrijf nieuwsberichten met afbeelding en kies wanneer ze verschijnen en weer verdwijnen. Ze komen op de homepage en hier op de startpagina.',
      side: 'right',
    },

    // Beheer
    {
      element: sidebar('beheer-voorstellingen'),
      titel: 'Voorstellingen',
      tekst:
        'Voorstellingen aanmaken en bewerken: titel, groep, speeldata, spelers en prijs. Hier publiceer je een voorstelling op de website en archiveer je hem als hij voorbij is.',
      side: 'right',
    },
    {
      element: sidebar('beheer-reserveringen'),
      titel: 'Reserveringen',
      tekst:
        'Alle reserveringen per voorstelling, met de bezetting per speeldatum. Je kunt reserveringen aanpassen en losse verkoop bekijken.',
      side: 'right',
    },
    {
      element: sidebar('kassa'),
      titel: 'De Kassa',
      tekst:
        'Gebruik je op de speeldag zelf: bezoekers opzoeken, hun aanwezigheid afvinken en losse kaartverkoop aan de deur registreren. Op die pagina krijg je ook een eigen rondleiding.',
      side: 'right',
    },
    {
      element: sidebar('printen'),
      titel: 'Printen',
      tekst:
        'Maak een PDF met "Gereserveerd voor"-kaartjes voor de stoelen in de zaal, op basis van de reserveringen van een voorstelling.',
      side: 'right',
    },
    {
      element: sidebar('beheer-leden'),
      titel: 'Leden',
      tekst:
        'Beheer alle accounts: rollen en groep toewijzen, en bepalen bij welke voorstellingen iemand foto\'s in de galerij mag zien.',
      side: 'right',
    },
    {
      element: sidebar('beheer-nieuwe-leden'),
      titel: 'Leden aanmeldingen',
      tekst:
        'Aanmeldingen via het "Lid worden"-formulier. Bekijk het bericht, zet de status op geverifieerd en koppel de aanmelding aan een account.',
      side: 'right',
    },
    {
      element: sidebar('beheer-vrienden'),
      titel: 'Vrienden aanmeldingen',
      tekst: 'Aanmeldingen van mensen die Vriend van Tovedem willen worden.',
      side: 'right',
    },
    {
      element: sidebar('beheer-contact'),
      titel: 'Contact berichten',
      tekst: 'Alle berichten die via het contactformulier op de website binnenkomen.',
      side: 'right',
    },
    {
      element: sidebar('beheer-sponsoren'),
      titel: 'Sponsoren',
      tekst:
        'Sponsoren, donateurs en vrienden toevoegen, bewerken of in één keer importeren. Deze lijst wordt aan de kassa gebruikt om te controleren of iemand vriend of lid is.',
      side: 'right',
    },
    {
      element: sidebar('beheer-mails'),
      titel: 'Emails',
      tekst:
        'Bewerk de teksten van de automatische mails, verstuur bevestigingsmails opnieuw en stel nieuwsbrieven op en verstuur ze.',
      side: 'right',
    },
    {
      element: sidebar('beheer-mail-lijst'),
      titel: 'Mail lijst',
      tekst: 'Iedereen die zich heeft aangemeld voor de nieuwsbrief, per groep.',
      side: 'right',
    },

    // Galerij
    {
      element: sidebar('galerij'),
      titel: 'Galerij',
      tekst: galerijTekst,
      side: 'right',
    },

    // Developers
    {
      element: sidebar('sectie-developers'),
      titel: 'Developers',
      tekst:
        'Alleen voor global admins: het rol-overzicht (wie mag wat) en snelkoppelingen naar PocketBase, MailJet en ZoHo.',
      side: 'right',
    },

    {
      element: '#welkom-rondleiding-knop',
      titel: 'Rondleiding opnieuw bekijken',
      tekst:
        'Deze rondleiding krijg je alleen bij je eerste bezoek. Wil je hem later nog eens zien, klik dan hier.',
      side: 'bottom',
    },
  ];

  // Stappen in het zijmenu openen eerst het menu; de overige zetten het terug
  const knopInZijmenu = (stap: RondleidingStap): boolean =>
    !!stap.element?.startsWith('[data-rondleiding=') &&
    stap.element !== sidebar('sidebar-knop');

  return stappen.map((stap) => ({
    ...stap,
    voorTonen: knopInZijmenu(stap) ? zijmenu.open : zijmenu.herstel,
  }));
}
