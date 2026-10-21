import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClientResponseError } from 'pocketbase';
import { lastValueFrom } from 'rxjs';
import {
  Draaiboek,
  DraaiboekDag,
  DraaiboekGroep,
  DraaiboekInhoud,
  DraaiboekItem,
} from '../../../../models/domain/draaiboek.model';
import { AuthService } from '../../../../shared/services/auth.service';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import {
  DraaiboekEditDialogComponent,
  DraaiboekEditDialogData,
} from './draaiboek-edit-dialog/draaiboek-edit-dialog.component';
import { STANDAARD_DRAAIBOEKEN } from './draaiboek-standaard';

interface TijdlijnRegel extends DraaiboekItem {
  /** Tijd van dit item of, als die leeg is, van het vorige item met een tijd. */
  effectieveTijd: string;
}

const ROL_KLEUREN = 8;

@Component({
  selector: 'app-draaiboek',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  templateUrl: './draaiboek.component.html',
  styleUrl: './draaiboek.component.scss',
})
export class DraaiboekComponent implements OnInit {
  groep = input.required<DraaiboekGroep>();

  private client = inject(PocketbaseService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  record = signal<Draaiboek | null>(null);
  inhoud = signal<DraaiboekInhoud | null>(null);
  geselecteerdeRol = signal<string | null>(null);

  kanBewerken = computed(
    () =>
      this.authService.isGlobalAdmin ||
      this.authService.userHasAnyRole(['admin', 'bestuur'])
  );

  async ngOnInit(): Promise<void> {
    try {
      const record = await this.client.directClient
        .collection('draaiboeken')
        .getFirstListItem<Draaiboek>(
          this.client.directClient.filter('groep = {:groep}', {
            groep: this.groep(),
          })
        );
      this.record.set(record);
      this.inhoud.set(record.inhoud);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.status === 404)) {
        console.error('Error loading draaiboek:', error);
      }
      // Nog niets opgeslagen (of collectie bestaat nog niet): toon het standaard concept
      this.inhoud.set(structuredClone(STANDAARD_DRAAIBOEKEN[this.groep()]));
    } finally {
      this.loading.set(false);
    }
  }

  tijdlijn(dag: DraaiboekDag): TijdlijnRegel[] {
    let vorigeTijd = '';
    const regels = dag.items.map((item) => {
      vorigeTijd = item.tijd || vorigeTijd;
      return { ...item, effectieveTijd: vorigeTijd };
    });

    const rol = this.geselecteerdeRol();
    return rol ? regels.filter((regel) => regel.door.includes(rol)) : regels;
  }

  /** Toon de tijd bij het eerste item van een tijdsblok (of altijd bij filteren). */
  toonTijd(regels: TijdlijnRegel[], index: number): boolean {
    return (
      index === 0 ||
      regels[index].effectieveTijd !== regels[index - 1].effectieveTijd
    );
  }

  aantalTaken(dag: DraaiboekDag): number {
    const rol = this.geselecteerdeRol();
    return rol ? dag.items.filter((item) => item.door.includes(rol)).length : 0;
  }

  selecteerRol(rol: string): void {
    this.geselecteerdeRol.update((huidig) => (huidig === rol ? null : rol));
  }

  /** Vaste kleur per rol, zodat een rol overal dezelfde kleur heeft. */
  rolKleur(rol: string): string {
    let hash = 0;
    for (const teken of rol) {
      hash = (hash * 31 + teken.charCodeAt(0)) >>> 0;
    }
    return `rol-kleur-${hash % ROL_KLEUREN}`;
  }

  async bewerken(): Promise<void> {
    const inhoud = this.inhoud();
    if (!inhoud) return;

    const dialogRef = this.dialog.open<
      DraaiboekEditDialogComponent,
      DraaiboekEditDialogData,
      Draaiboek
    >(DraaiboekEditDialogComponent, {
      data: {
        groep: this.groep(),
        recordId: this.record()?.id ?? null,
        inhoud: structuredClone(inhoud),
      },
      width: '1100px',
      maxWidth: '98vw',
      maxHeight: '95vh',
      disableClose: true,
    });

    const opgeslagen = await lastValueFrom(dialogRef.afterClosed());
    if (opgeslagen) {
      this.record.set(opgeslagen);
      this.inhoud.set(opgeslagen.inhoud);
      this.geselecteerdeRol.set(null);
    }
  }
}
