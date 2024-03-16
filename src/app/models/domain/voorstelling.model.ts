import { BaseModel } from 'pocketbase';

export default interface Voorstelling extends BaseModel {
  groep: string;
  titel: string;
  ondertitel?: string;
  regie: string;
  omschrijving: string;
  afbeelding?: string;
  datum_tijd_1: string;
  datum_tijd_2?: string;
  spelers: string[];
}
