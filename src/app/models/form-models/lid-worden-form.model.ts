import { Groep } from '../domain/groep.model';

/**
 * Form model for lid worden (membership) form
 * Used with Angular Signal Forms (experimental in Angular 21)
 */
export interface LidWordenFormModel {
  voornaam: string;
  achternaam: string;
  email: string;
  geboorteDatum: Date | null;
  selectedGroep: Groep | null;
  message: string;
}
