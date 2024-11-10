import { BaseModel } from 'pocketbase';

export interface Reservering extends BaseModel {
  email: string;
  voornaam: string;
  achternaam: string;
  is_vriend_van_tovedem: boolean;
  is_lid_van_vereniging: boolean;
  voorstelling: string;
  datum_tijd_1_aantal: number;
  datum_tijd_2_aantal: number;
  opmerking: string;
  guid: string;
}
