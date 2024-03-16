import { BaseModel } from 'pocketbase';

export default interface Speler extends BaseModel {
  naam: string;
}
