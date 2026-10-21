import { BaseModel } from 'pocketbase';

export interface ContactVerzoek extends BaseModel {
  name: string;
  email: string;
  subject: string;
  message: string;
}
