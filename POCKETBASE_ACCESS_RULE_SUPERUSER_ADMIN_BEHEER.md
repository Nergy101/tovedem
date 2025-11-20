# PocketBase Access Rule voor Superuser, Admin en Beheer

## Access Rule - Optie 1: Met rol namen (als rollen veld de namen bevat)

Als `@request.auth.rollen` een array is die de rol **namen** bevat (zoals `["admin", "beheer"]`), gebruik dan:

```
@request.auth.id != "" && (@request.auth.collectionName = "_superusers" || @request.auth.rollen ~ 'admin' || @request.auth.rollen ~ 'beheer')
```

**Of met de `?=` operator (aanbevolen voor arrays):**

```
@request.auth.id != "" && (@request.auth.collectionName = "_superusers" || "admin" ?= @request.auth.rollen || "beheer" ?= @request.auth.rollen)
```

## Access Rule - Optie 2: Met rol IDs (als rollen veld de IDs bevat)

Als `@request.auth.rollen` een array is die de rol **IDs** bevat (zoals `["xyz789abc", "abc123xyz"]`), gebruik dan:

```
@request.auth.id != "" && (@request.auth.collectionName = "_superusers" || "ADMIN_ROL_ID" in @request.auth.rollen || "BEHEER_ROL_ID" in @request.auth.rollen)
```

## Uitleg

- `@request.auth.id != ""` - Gebruiker moet ingelogd zijn
- `@request.auth.collectionName = "_superusers"` - Superusers (global admins) hebben altijd toegang
- `@request.auth.rollen ~ 'admin'` - Controleert of 'admin' voorkomt in de rollen array (string matching)
- `"admin" ?= @request.auth.rollen` - Controleert of 'admin' voorkomt in de rollen array (array contains check)
- `"ADMIN_ROL_ID" in @request.auth.rollen` - Controleert of de admin rol ID voorkomt in de rollen array

## Welke notatie gebruiken?

**Gebruik Optie 1 (`~` of `?=`) als:**

- Je `rollen` veld de rol **namen** bevat (bijv. `["admin", "beheer", "lid"]`)
- Je niet de rol IDs hoeft op te zoeken
- Je eenvoudigere, leesbaardere rules wilt

**Gebruik Optie 2 (`in`) als:**

- Je `rollen` veld de rol **IDs** bevat (bijv. `["xyz789abc", "abc123xyz"]`)
- Je expliciet wilt zijn over welke rol records toegang hebben
- Je rollen structuur relationeel is (rollen zijn een aparte collectie)

## Belangrijk voor Optie 2

**Vervang `"ADMIN_ROL_ID"` en `"BEHEER_ROL_ID"` met de daadwerkelijke IDs van de admin en beheer rollen uit de `rollen` collectie.**

Om de rol IDs te vinden:

1. Ga naar PocketBase Admin Panel
2. Open de `rollen` collectie
3. Zoek de rol met `rol = "admin"` en kopieer de ID
4. Zoek de rol met `rol = "beheer"` en kopieer de ID
5. Vervang `"ADMIN_ROL_ID"` en `"BEHEER_ROL_ID"` in de rule met die IDs

## Voorbeelden

**Voorbeeld met rol namen:**

```
@request.auth.id != "" && (@request.auth.collectionName = "_superusers" || @request.auth.rollen ~ 'admin' || @request.auth.rollen ~ 'beheer')
```

**Voorbeeld met rol IDs (als admin ID = "xyz789abc" en beheer ID = "abc123xyz"):**

```
@request.auth.id != "" && (@request.auth.collectionName = "_superusers" || "xyz789abc" in @request.auth.rollen || "abc123xyz" in @request.auth.rollen)
```

## Toepassing

Deze rule kan worden gebruikt voor:

- **List Rule** - Om te bepalen welke records een gebruiker kan zien
- **View Rule** - Om te bepalen of een gebruiker een specifiek record kan bekijken
- **Create Rule** - Om te bepalen of een gebruiker nieuwe records kan aanmaken
- **Update Rule** - Om te bepalen of een gebruiker records kan bijwerken
- **Delete Rule** - Om te bepalen of een gebruiker records kan verwijderen

## Hoe controleer je welke structuur je hebt?

Om te bepalen welke notatie je moet gebruiken, controleer wat er in `@request.auth.rollen` staat:

1. **In PocketBase Admin Panel:**

   - Ga naar de `users` collectie
   - Bekijk een gebruiker record
   - Kijk naar het `rollen` veld
   - Als het eruit ziet als `["admin", "beheer"]` → gebruik Optie 1 (`~` of `?=`)
   - Als het eruit ziet als `["xyz789abc", "abc123xyz"]` → gebruik Optie 2 (`in`)

2. **Via de API:**
   - Log in als gebruiker
   - Check `@request.auth.rollen` in een test rule
   - Of gebruik de PocketBase client om de auth data te inspecteren

## Opmerkingen

- Deze rule geeft alleen toegang aan superusers, admins en beheerders
- Andere gebruikers (zoals gewone leden of bezoekers) hebben geen toegang
- De rule controleert of de gebruiker ingelogd is en een van de toegestane rollen heeft
- De `~` operator doet string matching (regex), terwijl `?=` specifiek voor array contains is
- Als je `~` gebruikt en het werkt, betekent dit dat je rollen veld waarschijnlijk de namen bevat, niet de IDs
