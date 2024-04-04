import { BaseModel } from 'pocketbase';

export default interface Mail extends BaseModel {
  naam?: string;
  inhoud?: string;
}
