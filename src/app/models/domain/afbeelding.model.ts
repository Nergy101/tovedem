import { BaseModel } from 'pocketbase';

export interface Afbeelding extends BaseModel {
    bestand: string;
}
