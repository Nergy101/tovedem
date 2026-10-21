# PocketBase: Draaiboeken (productie-info)

Op **Productie-info → Tovedem / Cloos / Mejoto's** staat een concept-draaiboek per groep.
Leden kunnen het bekijken; admin en bestuur kunnen het bewerken via de knop **Bewerken**.

Zolang er voor een groep nog niets is opgeslagen, toont de app een standaard concept
(`src/app/pages/members/productie-info/draaiboek/draaiboek-standaard.ts`, uitgewerkt uit
eerdere draaiboeken, zonder namen). De eerste keer "Opslaan" maakt het record aan.

## Collectie `draaiboeken` aanmaken (Base collection)

| Veld     | Type | Instellingen                                 |
| -------- | ---- | -------------------------------------------- |
| `groep`  | Text | Verplicht. Waarde: `Tovedem`, `Cloos` of `Mejotos` |
| `inhoud` | JSON | Verplicht. Max size gerust op 1 MB zetten    |

Index: **unique** op `groep`.

API rules:

- **List / View** (leden en hoger):

  ```
  @request.auth.rollen.rol ?= "lid" || @request.auth.rollen.rol ?= "admin" || @request.auth.rollen.rol ?= "bestuur"
  ```

- **Create / Update**:

  ```
  @request.auth.rollen.rol ?= "admin" || @request.auth.rollen.rol ?= "bestuur"
  ```

- **Delete**: leeg laten (alleen superusers). Een record verwijderen zet die groep terug op het standaard concept.

## Privacy

Het draaiboek is zichtbaar voor alle leden. Gebruik in het draaiboek alleen **rollen**
(Regie, Grime, Coördinatie, …), geen namen of telefoonnummers. In de editor kies je bij
"Door" uit de lijst met rollen.
