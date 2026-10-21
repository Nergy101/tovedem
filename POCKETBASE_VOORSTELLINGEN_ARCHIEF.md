# PocketBase: Automatisch archiveren van voorstellingen

Een voorstelling wordt automatisch gearchiveerd (`gearchiveerd = true`) zodra er binnen **dezelfde groep** 3 latere voorstellingen zijn geweest. Per groep blijven dus altijd de laatste 3 gespeelde voorstellingen zichtbaar, plus alle toekomstige.

- "Geweest" = de laatste speeldatum (`datum_tijd_2`, anders `datum_tijd_1`) ligt in het verleden.
- Gearchiveerde voorstellingen staan niet meer op de openbare pagina's (home, agenda, groep). De albums in de galerij blijven gewoon bestaan.
- De controle draait elke nacht om 03:15 (cron `voorstellingen-archiveren`).
- Op **Beheer → Voorstellingen** staan de tabbladen *Actueel* en *Gearchiveerd*. Daar kun je ook handmatig archiveren of terugzetten.
- **Terugzetten** zet `niet_auto_archiveren = true`, zodat de nachtelijke controle de voorstelling niet opnieuw archiveert. Handmatig archiveren zet dit veld weer uit.

## 1. Veld toevoegen aan `voorstellingen`

| Naam                   | Type | Instellingen  |
| ---------------------- | ---- | ------------- |
| `niet_auto_archiveren` | Bool | niet verplicht |

## 2. Hooks deployen

Kopieer naar `pb_hooks` op de server en herstart PocketBase:

- `voorstellingen-archief.js` (nieuw: logica)
- `voorstellingen-archief.pb.js` (nieuw: nachtelijke cron)

De cron staat daarna in het admin panel onder **Settings → Crons**, waar je hem ook direct kunt starten om het te testen.

## Let op bij de eerste run

Bij de eerste run worden in één keer alle oudere voorstellingen gearchiveerd die al 3 of meer opvolgers binnen hun groep hebben. Op de groepspagina's blijven bij "afgelopen voorstellingen" dan alleen de laatste 3 per groep over. Wil je een voorstelling toch zichtbaar houden, zet hem dan terug via het tabblad *Gearchiveerd*.
