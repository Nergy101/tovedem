import { BaseModel } from 'pocketbase';

export type MailLijstGroep = 'bezoeker' | 'tovedemlid' | 'sponsor';

export interface MailLijstContact extends BaseModel {
  email: string;
  voornaam: string;
  achternaam: string;
  groep: MailLijstGroep;
  actief: boolean;
}
