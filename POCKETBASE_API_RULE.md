# PocketBase API Rule voor Reserveringen Collectie

## Update Rule

Voor de `reserveringen` collectie in PocketBase, stel de volgende **Update Rule** in:

```
@request.auth.id != "" && (@request.auth.email = email || @request.auth.collectionName = "_superusers" || "ADMIN_ROL_ID" in @request.auth.rollen)
```

## Uitleg

- `@request.auth.id != ""` - Gebruiker moet ingelogd zijn
- `@request.auth.email = email` - Het email adres van de ingelogde gebruiker moet overeenkomen met het email veld van de reservering
- `@request.auth.collectionName = "_superusers"` - Superusers (global admins) hebben altijd toegang
- `"ADMIN_ROL_ID" in @request.auth.rollen` - Gebruikers met admin rol hebben toegang

## Belangrijk

**Vervang `"ADMIN_ROL_ID"` met de daadwerkelijke ID van de admin rol uit de `rollen` collectie.**

Om de admin rol ID te vinden:

1. Ga naar PocketBase Admin Panel
2. Open de `rollen` collectie
3. Zoek de rol met `rol = "admin"`
4. Kopieer de ID van die rol
5. Vervang `"ADMIN_ROL_ID"` in de rule met die ID (bijvoorbeeld: `"abc123xyz" in @request.auth.rollen`)

## Voorbeeld

Als de admin rol ID `"xyz789abc"` is, wordt de rule:

```
@request.auth.id != "" && (@request.auth.email = email || @request.auth.collectionName = "_superusers" || "xyz789abc" in @request.auth.rollen)
```

## Opmerkingen

- PocketBase doet automatisch case-insensitive matching tussen `@request.auth.email` en `email` veld
- Deze rule geldt alleen voor UPDATE operaties
- Voor CREATE en DELETE operaties kunnen aparte rules nodig zijn (afhankelijk van je requirements)
