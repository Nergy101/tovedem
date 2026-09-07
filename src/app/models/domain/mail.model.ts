import { BaseModel } from 'pocketbase';

export interface Mail extends BaseModel {
  naam: string;
  onderwerp: string;
  inhoud: string;
  status: string;
}
