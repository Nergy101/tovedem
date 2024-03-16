import { BaseModel } from 'pocketbase';

export default interface Reservering extends BaseModel {
  email: string;
  voornaam: string;
  achternaam: string;
  is_vriend_van_tovedem: boolean;
  is_lid_van_vereniging: boolean;
  voorstelling: string;
  datum_tijd_1_aantal: number;
  datum_tijd_2_aantal: number;
}
