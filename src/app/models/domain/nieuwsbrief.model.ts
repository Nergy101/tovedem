import { BaseModel } from 'pocketbase';
import { NieuwsbriefBlok } from './nieuwsbrief-blok.model';
import { MailLijstGroep } from './mail-lijst-contact.model';

export type NieuwsbriefStatus = 'concept' | 'klaar' | 'verzonden';
export type NieuwsbriefDoelgroep = 'iedereen' | MailLijstGroep;

export interface Nieuwsbrief extends BaseModel {
  titel: string;
  status: NieuwsbriefStatus;
  doelgroep: NieuwsbriefDoelgroep;
  blokken: NieuwsbriefBlok[];
  verzonden_op?: string;
}
