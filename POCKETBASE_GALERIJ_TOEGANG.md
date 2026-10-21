# PocketBase: Galerij toegang per voorstelling

Foto albums (`voorstellingen_folders`) zijn alleen zichtbaar voor:

- superusers, en gebruikers met rol `admin`, `bestuur` of `beheer` → alle albums
- overige gebruikers → alleen albums van voorstellingen die in hun `galerij_voorstellingen` staan

Koppelen gebeurt via **Beheer leden** → klik op een gebruiker → vink voorstellingen aan.

## 1. Veld toevoegen aan `users`

| Naam                     | Type     | Instellingen                                   |
| ------------------------ | -------- | ---------------------------------------------- |
| `galerij_voorstellingen` | Relation | Collection: `voorstellingen`, Multiple (geen max), niet verplicht |

## 2. API rules `voorstellingen_folders`

**List rule** en **View rule** (beide hetzelfde):

```
@request.auth.id != "" && (
  @request.auth.rollen.rol ?= "admin" ||
  @request.auth.rollen.rol ?= "bestuur" ||
  @request.auth.rollen.rol ?= "beheer" ||
  @request.auth.galerij_voorstellingen.id ?= voorstelling
)
```

- Superusers slaan API rules altijd over.
- De foto-velden zijn protected files: de file token geeft alleen toegang tot bestanden van records die de gebruiker via de **View rule** mag zien. De foto's zelf zijn dus ook afgeschermd, niet alleen de lijst.
- Albums zonder gekoppelde voorstelling zijn alleen zichtbaar voor admin/bestuur/beheer.

## 3. API rule `users` – Update rule

Admin/bestuur/beheer moeten `galerij_voorstellingen` van andere gebruikers kunnen aanpassen, en een gebruiker mag zichzelf **geen** toegang geven. Combineer met de bestaande rule, bijvoorbeeld:

```
(id = @request.auth.id && @request.body.galerij_voorstellingen:isset = false) ||
@request.auth.rollen.rol ?= "admin" ||
@request.auth.rollen.rol ?= "bestuur" ||
@request.auth.rollen.rol ?= "beheer"
```

Let op: zonder `@request.body.galerij_voorstellingen:isset = false` kan een lid via de API zichzelf aan elke voorstelling koppelen.

## Testen

1. Log in als een lid zonder koppelingen → galerij toont "Je hebt nog geen toegang tot foto albums".
2. Koppel het lid aan één voorstelling → alleen dat album is zichtbaar.
3. Open een foto-URL van een ander album met de token van dat lid → 404/403.
4. Log in als admin/bestuur → alle albums zichtbaar.
