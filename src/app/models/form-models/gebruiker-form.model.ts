import { Groep } from '../domain/groep.model';
import { Rol } from '../domain/rol.model';
import { Speler } from '../domain/speler.model';

/**
 * Form model for gebruiker (user) create/edit form
 * Used with Angular Signal Forms (experimental in Angular 21)
 */
export interface GebruikerFormModel {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  rollen: string[]; // Array of role IDs
  groep: string | null; // Group ID
  speler: string | null; // Player ID
}

