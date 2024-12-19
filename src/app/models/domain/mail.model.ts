import { BaseModel } from 'pocketbase';

export interface Mail extends BaseModel {
  naam: string;
  inhoud: string;
  status: string;
}
