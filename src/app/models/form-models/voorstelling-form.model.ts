import { Groep } from '../domain/groep.model';
import { Speler } from '../domain/speler.model';
import { FilePreviewModel } from 'ngx-awesome-uploader';

/**
 * Form model for voorstelling (performance) create/edit form
 * Used with Angular Signal Forms (experimental in Angular 21)
 */
export interface VoorstellingFormModel {
  titel: string;
  ondertitel: string | null; // Optional in PocketBase (ondertitel?: string)
  regie: string; // Required in PocketBase (regie: string)
  omschrijving: string; // Required in PocketBase (omschrijving: string)
  selectedGroep: Groep | null;
  datum1: Date | null;
  datum2: Date | null; // Optional in PocketBase (datum_tijd_2?: string)
  tijd1: string;
  tijd2: string;
  beschikbare_stoelen_datum_tijd_1: number;
  beschikbare_stoelen_datum_tijd_2: number; // Required in PocketBase (not optional)
  prijs_per_kaartje: number; // Required in PocketBase (prijs_per_kaartje: number)
  publicatie_datum: Date | null;
  selectedSpelers: Speler[];
  afbeelding: FilePreviewModel | null; // Optional in PocketBase (afbeelding?: string)
}
