import { BaseModel } from 'pocketbase';

export interface Voorstelling extends BaseModel {
  groep: string;
  titel: string;
  ondertitel?: string;
  regie: string;
  omschrijving: string;
  afbeelding?: string;
  datum_tijd_1: string;
  datum_tijd_2?: string;
  spelers?: string[];
};

export function voorstellingIsInToekomst(date: Date) {
  const currentDate = new Date() 
  return new Date(date) > currentDate;
}

export function dagenTussenNuEnVoorstellingDatum(date: Date) {
  const datum1 = new Date(date)
  const currentDate = new Date()
  
  return getDaysBetweenDates(datum1, currentDate)
}

// private functions
function getDaysBetweenDates(date1: Date, date2: Date) {
  const oneDay = 24 * 60 * 60 * 1000; // Number of milliseconds in one day
  const diffInTime = new Date(date2).getTime() - new Date(date1).getTime(); // Difference in milliseconds
  return diffInTime / oneDay; // Convert milliseconds to days
}
