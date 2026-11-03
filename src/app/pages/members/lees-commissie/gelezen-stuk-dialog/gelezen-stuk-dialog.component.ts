import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  Doelgroep,
  GelezenStuk,
  LeesAdvies,
} from '../../../../models/domain/gelezen-stuk.model';
import { SterrenBeoordelingComponent } from '../../../../shared/components/sterren-beoordeling/sterren-beoordeling.component';
import { GelezenStukInvoer } from '../lees-commissie.service';

export interface GelezenStukDialogData {
  stuk?: GelezenStuk;
  /** Naam die standaard bij "Gelezen door" ingevuld wordt. */
  lezer: string;
}

export const GENRES = [
  'Komedie',
  'Klucht',
  'Drama',
  'Tragikomedie',
  'Thriller',
  'Musical',
  'Avontuur',
  'Sprookje',
  'Overig',
];

export const DOELGROEPEN: { waarde: Doelgroep; label: string }[] = [
  { waarde: 'Tovedem', label: 'Tovedem' },
  { waarde: 'Cloos', label: 'Cloos (jeugd)' },
  { waarde: 'Mejotos', label: "Mejoto's (jongeren)" },
];

@Component({
  selector: 'app-gelezen-stuk-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatIconModule,
    SterrenBeoordelingComponent,
  ],
  templateUrl: './gelezen-stuk-dialog.component.html',
  styleUrl: './gelezen-stuk-dialog.component.scss',
})
export class GelezenStukDialogComponent {
  dialogRef = inject(MatDialogRef<GelezenStukDialogComponent>);
  data: GelezenStukDialogData = inject(MAT_DIALOG_DATA);

  genres = GENRES;
  doelgroepen = DOELGROEPEN;
  isUpdate = !!this.data.stuk;

  titel = signal(this.data.stuk?.titel ?? '');
  auteur = signal(this.data.stuk?.auteur ?? '');
  genre = signal(this.data.stuk?.genre ?? '');
  aantalMannen = signal<number>(this.data.stuk?.aantal_mannen ?? 0);
  aantalVrouwen = signal<number>(this.data.stuk?.aantal_vrouwen ?? 0);
  aantalVrij = signal<number>(this.data.stuk?.aantal_vrij ?? 0);
  aantalBedrijven = signal<number | null>(
    this.data.stuk?.aantal_bedrijven ?? null
  );
  duurMinuten = signal<number | null>(this.data.stuk?.duur_minuten ?? null);
  sterren = signal(this.data.stuk?.sterren ?? 0);
  advies = signal<LeesAdvies>(this.data.stuk?.advies ?? 'misschien');
  geschiktVoor = signal<Doelgroep[]>(this.data.stuk?.geschikt_voor ?? []);
  samenvatting = signal(this.data.stuk?.samenvatting ?? '');
  opmerkingen = signal(this.data.stuk?.opmerkingen ?? '');
  gelezenDoor = signal(this.data.stuk?.gelezen_door ?? this.data.lezer);
  gelezenOp = signal(
    (this.data.stuk?.gelezen_op ?? new Date().toISOString()).slice(0, 10)
  );

  /** Totaal aantal rollen volgt uit mannen + vrouwen + vrij te verdelen. */
  aantalSpelers = computed(
    () =>
      (this.aantalMannen() || 0) +
      (this.aantalVrouwen() || 0) +
      (this.aantalVrij() || 0)
  );

  foutmelding = computed(() => {
    if (!this.titel().trim()) return 'Vul de titel van het stuk in.';
    if (this.aantalSpelers() < 1)
      return 'Vul in hoeveel spelers er in het stuk zitten.';
    if (this.sterren() < 1) return 'Geef het stuk minimaal één ster.';
    return null;
  });

  toggleDoelgroep(doelgroep: Doelgroep, aangevinkt: boolean): void {
    this.geschiktVoor.update((huidig) =>
      aangevinkt
        ? [...huidig, doelgroep]
        : huidig.filter((d) => d !== doelgroep)
    );
  }

  opslaan(): void {
    if (this.foutmelding()) return;

    const invoer: GelezenStukInvoer = {
      titel: this.titel().trim(),
      auteur: this.auteur().trim(),
      genre: this.genre(),
      aantal_spelers: this.aantalSpelers(),
      aantal_mannen: this.aantalMannen() || 0,
      aantal_vrouwen: this.aantalVrouwen() || 0,
      aantal_vrij: this.aantalVrij() || 0,
      aantal_bedrijven: this.aantalBedrijven() || null,
      duur_minuten: this.duurMinuten() || null,
      sterren: this.sterren(),
      advies: this.advies(),
      geschikt_voor: this.geschiktVoor(),
      samenvatting: this.samenvatting().trim(),
      opmerkingen: this.opmerkingen().trim(),
      gelezen_door: this.gelezenDoor().trim(),
      gelezen_op: new Date(this.gelezenOp()).toISOString(),
    };
    this.dialogRef.close(invoer);
  }
}
