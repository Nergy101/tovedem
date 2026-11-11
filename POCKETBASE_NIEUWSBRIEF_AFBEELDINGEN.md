# PocketBase: afbeeldingen in de nieuwsbrief

In de nieuwsbrief-editor kun je bij een **Afbeelding**-blok een foto uploaden of uit de galerij kiezen.
Galerijfoto's (`voorstellingen_folders`) zijn *protected files*: ontvangers van de mail kunnen die URL's niet openen.
Daarom slaat de editor een verkleinde kopie (max. 1200 px breed) op in de collectie **`afbeeldingen`** en gebruikt die URL in de mail.

## Benodigde instellingen `afbeeldingen`

| Veld      | Type | Instellingen                                                                 |
| --------- | ---- | ---------------------------------------------------------------------------- |
| `bestand` | File | Single, max. 5 MB, mime types `image/jpeg`, `image/png`, `image/webp`, **Protected: uit** |

**Protected moet uit staan**, anders zien ontvangers een kapotte afbeelding.

### API rules

- **View rule**: leeg laten (openbaar), zodat mailprogramma's de afbeelding kunnen laden.
- **Create rule** (alleen wie nieuwsbrieven maakt):

```
@request.auth.id != "" && (
  @request.auth.rollen.rol ?= "admin" ||
  @request.auth.rollen.rol ?= "bestuur"
)
```

- **List**, **Update** en **Delete**: alleen superusers (slotje), tenzij je ze ergens anders voor nodig hebt.

## Voorstellingen

Het blok **Voorstelling** gebruikt de afbeelding uit `voorstellingen.afbeelding`. Die moet ook openbaar zijn
(dat is al zo, de reserveringsbevestiging gebruikt hem ook).

## Testen

1. Maak een nieuwsbrief, voeg een Afbeelding-blok toe en kies **Kies uit galerij**.
2. Open in **Voorbeeld** de afbeelding: die moet zichtbaar zijn.
3. Open de afbeeldings-URL in een privévenster (niet ingelogd): ook dan moet hij laden.
