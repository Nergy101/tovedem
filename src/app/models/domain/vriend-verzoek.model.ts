import { BaseModel } from 'pocketbase';

export interface VriendVerzoek extends BaseModel {
  name: string;
  email: string;
  subject: string;
  message: string;
}
