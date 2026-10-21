import { BaseModel } from 'pocketbase';

/** Formulieren waarvan de beheer-mails naar instelbare adressen gaan (zie pb_hooks/mail-ontvangers.js). */
export type MailFormulier =
  | 'contact'
  | 'sinterklaas'
  | 'lid_worden'
  | 'vriend_worden';

export interface MailOntvangers extends BaseModel {
  formulier: MailFormulier;
  emails: string[];
}
