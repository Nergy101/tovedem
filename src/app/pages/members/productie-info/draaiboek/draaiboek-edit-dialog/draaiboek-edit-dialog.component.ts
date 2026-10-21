import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import {
  Draaiboek,
  DraaiboekDag,
  DraaiboekGroep,
  DraaiboekInhoud,
  DraaiboekItem,
  DraaiboekSectie,
} from '../../../../../models/domain/draaiboek.model';
import { ConfirmatieDialogComponent } from '../../../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { ErrorService } from '../../../../../shared/services/error.service';
import { PocketbaseService } from '../../../../../shared/services/pocketbase.service';
import { STANDAARD_DRAAIBOEKEN } from '../draaiboek-standaard';

export interface DraaiboekEditDialogData {
  groep: DraaiboekGroep;
  recordId: string | null;
  inhoud: DraaiboekInhoud;
}

const TIJD_REGEX = /^([01]?\d|2[0-3])[:.][0-5]\d$/;
const ALGEMENE_ROLLEN = ['Iedereen'];

@Component({
  selector: 'app-draaiboek-edit-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  templateUrl: './draaiboek-edit-dialog.component.html',
  styleUrl: './draaiboek-edit-dialog.component.scss',
})
export class DraaiboekEditDialogComponent {
  private dialogRef = inject(
    MatDialogRef<DraaiboekEditDialogComponent, Draaiboek>
  );
  private dialog = inject(MatDialog);
  private client = inject(PocketbaseService);
  private toastr = inject(ToastrService);
  private errorService = inject(ErrorService);
  data: DraaiboekEditDialogData = inject(MAT_DIALOG_DATA);

  inhoud: DraaiboekInhoud = this.data.inhoud;
  saving = signal(false);

  /** Rollen om uit te kiezen bij "door": gedefinieerde rollen plus alles wat al gebruikt wordt. */
  beschikbareRollen(): string[] {
    const rollen = new Set<string>([
      ...this.inhoud.rollen.map((r) => r.rol.trim()).filter(Boolean),
      ...ALGEMENE_ROLLEN,
    ]);
    this.inhoud.dagen.forEach((dag) =>
      dag.items.forEach((item) => item.door.forEach((rol) => rollen.add(rol)))
    );
    return [...rollen];
  }

  verplaats<T>(lijst: T[], index: number, richting: -1 | 1): void {
    const doel = index + richting;
    if (doel < 0 || doel >= lijst.length) return;
    [lijst[index], lijst[doel]] = [lijst[doel], lijst[index]];
  }

  verwijder<T>(lijst: T[], index: number): void {
    lijst.splice(index, 1);
  }

  // Rollen
  rolToevoegen(): void {
    this.inhoud.rollen.push({ rol: '', omschrijving: '' });
  }

  hernoemRol(index: number, nieuweNaam: string): void {
    const oud = this.inhoud.rollen[index].rol;
    const nieuw = nieuweNaam.trim();
    this.inhoud.rollen[index].rol = nieuw;
    if (!oud || oud === nieuw) return;
    // Hernoem de rol ook in alle tijdregels
    this.inhoud.dagen.forEach((dag) =>
      dag.items.forEach((item) => {
        item.door = item.door.map((rol) => (rol === oud ? nieuw : rol));
      })
    );
  }

  // Secties
  sectieToevoegen(): void {
    this.inhoud.secties.push({ titel: '', punten: [] });
  }

  puntenTekst(sectie: DraaiboekSectie): string {
    return sectie.punten.join('\n');
  }

  zetPunten(sectie: DraaiboekSectie, tekst: string): void {
    sectie.punten = tekst
      .split('\n')
      .map((punt) => punt.trim())
      .filter(Boolean);
  }

  // Dagen
  dagToevoegen(): void {
    this.inhoud.dagen.push({ naam: 'Nieuwe dag', omschrijving: '', items: [] });
  }

  itemToevoegen(dag: DraaiboekDag, index?: number): void {
    const nieuw: DraaiboekItem = { tijd: '', actie: '', door: [] };
    if (index === undefined) {
      dag.items.push(nieuw);
    } else {
      dag.items.splice(index + 1, 0, nieuw);
    }
  }

  /** Sorteer op tijd; items zonder tijd blijven bij het item erboven. */
  sorteerOpTijd(dag: DraaiboekDag): void {
    const blokken: DraaiboekItem[][] = [];
    for (const item of dag.items) {
      if (item.tijd || blokken.length === 0) {
        blokken.push([item]);
      } else {
        blokken[blokken.length - 1].push(item);
      }
    }
    const sleutel = (tijd: string): string => {
      const genormaliseerd = tijd.replace('.', ':').padStart(5, '0');
      // Tijden na middernacht (00:00-05:59) horen bij het einde van de dag
      return genormaliseerd < '06:00' ? `z${genormaliseerd}` : genormaliseerd;
    };
    blokken.sort((a, b) => sleutel(a[0].tijd).localeCompare(sleutel(b[0].tijd)));
    dag.items = blokken.flat();
  }

  ongeldigeTijd(tijd: string): boolean {
    return !!tijd && !TIJD_REGEX.test(tijd.trim());
  }

  private valideer(): string | null {
    if (!this.inhoud.titel.trim()) return 'Vul een titel in.';
    if (this.inhoud.rollen.some((r) => !r.rol.trim())) {
      return 'Elke rol moet een naam hebben.';
    }
    for (const dag of this.inhoud.dagen) {
      if (!dag.naam.trim()) return 'Elke dag moet een naam hebben.';
      for (const item of dag.items) {
        if (this.ongeldigeTijd(item.tijd)) {
          return `Ongeldige tijd "${item.tijd}" bij ${dag.naam}. Gebruik bijvoorbeeld 19:15.`;
        }
        if (!item.actie.trim()) {
          return `Er is een regel zonder actie bij ${dag.naam}.`;
        }
      }
    }
    return null;
  }

  private opgeschoond(): DraaiboekInhoud {
    return {
      titel: this.inhoud.titel.trim(),
      intro: this.inhoud.intro.trim(),
      rollen: this.inhoud.rollen.map((r) => ({
        rol: r.rol.trim(),
        omschrijving: r.omschrijving.trim(),
      })),
      secties: this.inhoud.secties
        .map((s) => ({ titel: s.titel.trim(), punten: s.punten }))
        .filter((s) => s.titel || s.punten.length),
      dagen: this.inhoud.dagen.map((dag) => ({
        naam: dag.naam.trim(),
        omschrijving: dag.omschrijving?.trim() ?? '',
        items: dag.items.map((item) => ({
          tijd: item.tijd.trim().replace('.', ':'),
          actie: item.actie.trim(),
          door: item.door,
          notitie: item.notitie?.trim() || undefined,
          belangrijk: item.belangrijk || undefined,
        })),
      })),
    };
  }

  async standaardHerstellen(): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Standaard herstellen',
        message:
          'Alle wijzigingen in dit scherm worden vervangen door het standaard concept draaiboek. Pas na "Opslaan" wordt dit definitief.',
      },
    });
    if (!(await lastValueFrom(dialogRef.afterClosed()))) return;

    this.inhoud = structuredClone(STANDAARD_DRAAIBOEKEN[this.data.groep]);
  }

  async opslaan(): Promise<void> {
    const fout = this.valideer();
    if (fout) {
      this.toastr.warning(fout, 'Controleer het draaiboek');
      return;
    }

    this.saving.set(true);
    try {
      const collection = this.client.directClient.collection('draaiboeken');
      const inhoud = this.opgeschoond();
      const record = this.data.recordId
        ? await collection.update<Draaiboek>(this.data.recordId, { inhoud })
        : await collection.create<Draaiboek>({
            groep: this.data.groep,
            inhoud,
          });
      this.toastr.success('Draaiboek opgeslagen', 'Gelukt!');
      this.dialogRef.close(record);
    } catch (error) {
      this.toastr.error(
        this.errorService.getErrorMessage(error, 'Draaiboek opslaan'),
        'Fout'
      );
    } finally {
      this.saving.set(false);
    }
  }

  async annuleren(): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Bewerken annuleren',
        message: 'Niet opgeslagen wijzigingen gaan verloren. Weet je het zeker?',
      },
    });
    if (await lastValueFrom(dialogRef.afterClosed())) {
      this.dialogRef.close();
    }
  }
}
