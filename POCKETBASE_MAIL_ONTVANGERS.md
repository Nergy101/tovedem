# PocketBase: Instelbare ontvangers van formulier-mails

Per formulier stel je in naar welke adressen de "beheer"-mail gaat (de mail met het bericht van de bezoeker):

| Formulier      | `formulier`-waarde | Instellen op pagina                  |
| -------------- | ------------------ | ------------------------------------ |
| Contact        | `contact`          | Beheer → Contact Berichten           |
| Sinterklaas    | `sinterklaas`      | Commissies → Sinterklaas verzoeken   |
| Lid worden     | `lid_worden`       | Beheer → Leden Aanmeldingen          |
| Vriend worden  | `vriend_worden`    | Beheer → Vrienden Aanmeldingen       |

Klik rechtsboven op het ⚙️-icoon (alleen zichtbaar voor admin/bestuur).

**Vangnet:** is er voor een formulier niets (geldigs) ingesteld, of bestaat de collectie nog niet, dan gaan de mails naar de standaard adressen in `pb_hooks/constants.js`. In de PocketBase-logs staat dan een waarschuwing.

## 1. Collectie `mail_ontvangers` aanmaken (Base collection)

| Veld        | Type | Instellingen          |
| ----------- | ---- | --------------------- |
| `formulier` | Text | Verplicht             |
| `emails`    | JSON | Verplicht             |

Index: **unique** op `formulier`.

API rules (List, View, Create, Update):

```
@request.auth.rollen.rol ?= "admin" || @request.auth.rollen.rol ?= "bestuur"
```

Delete rule: leeg laten (alleen superusers).

De hook `mail-ontvangers.pb.js` controleert bij opslaan dat het formulier bekend is, dat alle adressen geldig zijn en dat er minstens één adres is.

## 2. Collectie `contact_verzoeken`: rules voor de nieuwe beheerpagina

List en View rule:

```
@request.auth.rollen.rol ?= "admin" || @request.auth.rollen.rol ?= "bestuur"
```

Create rule ongewijzigd laten (het publieke contactformulier moet kunnen blijven aanmaken). Verwijderen kan in de app alleen een superuser.

## 3. Hooks deployen

Kopieer naar de `pb_hooks` map op de server en herstart PocketBase:

- `mail-ontvangers.js` (nieuw)
- `mail-ontvangers.pb.js` (nieuw: validatie + testmail-endpoint)
- `contact-emails.pb.js`, `sinterklaas-emails.pb.js`, `leden-emails.pb.js`, `vriend-worden-emails.pb.js` (aangepast)

## 4. Testplan voor de beheerder (per formulier uitvoeren!)

1. Open de beheerpagina en klik op ⚙️. De melding "Nog niet ingesteld" hoort te verschijnen.
2. Vul twee of meer adressen in → **Opslaan**.
3. Klik **Testmail versturen**. Controleer bij **elk** adres dat de mail `[TEST] Doorsturen …` is aangekomen (ook in de spam).
4. Vul het echte formulier op de website in (contact / Sinterklaas / lid worden / vriend worden) en controleer dat de beheer-mail bij alle ingestelde adressen aankomt, en **niet** meer bij `ptrvlaar@gmail.com` (tenzij dat adres is ingesteld).
5. Probeer een ongeldig adres op te slaan → er moet een foutmelding komen.
6. Controleer in de PocketBase-logs dat er geen waarschuwing "standaard adressen gebruikt" staat voor dit formulier.

Pas als stap 3 en 4 voor alle vier formulieren goed zijn, kan het adres uit `constants.js` eventueel worden vervangen door een algemeen Tovedem-adres als vangnet.
