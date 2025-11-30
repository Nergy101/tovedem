/**
 * Form model for reservation form
 * Used with Angular Signal Forms (experimental in Angular 21)
 */
export interface ReserveringFormModel {
  name: string;
  surname: string;
  email: string;
  email2: string;
  vriendVanTovedem: boolean;
  lidVanTovedemMejotos: boolean;
  opmerking: string;
  amountOfPeopleDate1: number;
  amountOfPeopleDate2: number;
}

