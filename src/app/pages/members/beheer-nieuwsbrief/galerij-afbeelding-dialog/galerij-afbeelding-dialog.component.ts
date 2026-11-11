import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { VoorstellingFolder } from '../../../../models/domain/voorstelling-folder.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';

export interface GekozenGalerijAfbeelding {
  folder: VoorstellingFolder;
  bestand: string;
}

const FOTO_VELDEN = ['fotos', 'fotos_2', 'fotos_3', 'fotos_4', 'fotos_5'] as const;

/** Kies een foto uit de galerij: eerst een album, dan een foto. */
@Component({
  selector: 'app-galerij-afbeelding-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './galerij-afbeelding-dialog.component.html',
  styleUrl: './galerij-afbeelding-dialog.component.scss',
})
export class GalerijAfbeeldingDialogComponent implements OnInit {
  private client = inject(PocketbaseService);
  private dialogRef = inject(
    MatDialogRef<GalerijAfbeeldingDialogComponent, GekozenGalerijAfbeelding>
  );

  loading = signal(true);
  fout = signal(false);
  folders = signal<VoorstellingFolder[]>([]);
  gekozenFolder = signal<VoorstellingFolder | null>(null);
  private fileToken = signal<string | null>(null);

  fotos = computed(() => {
    const folder = this.gekozenFolder();
    if (!folder) return [];
    return FOTO_VELDEN.flatMap((veld) => folder[veld] ?? []);
  });

  async ngOnInit(): Promise<void> {
    try {
      this.fileToken.set(await this.client.getFileToken());
      const folders = await this.client.directClient
        .collection('voorstellingen_folders')
        .getFullList<VoorstellingFolder>({ sort: '-jaar,naam' });
      this.folders.set(folders.filter((folder) => this.aantalFotos(folder) > 0));
    } catch (error) {
      console.error('Error loading galerij:', error);
      this.fout.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  aantalFotos(folder: VoorstellingFolder): number {
    return FOTO_VELDEN.reduce((totaal, veld) => totaal + (folder[veld]?.length ?? 0), 0);
  }

  omslag(folder: VoorstellingFolder): string {
    const eerste = FOTO_VELDEN.map((veld) => folder[veld]?.[0]).find(Boolean);
    return eerste ? this.fotoUrl(folder, eerste) : 'assets/Place-Holder-Image.jpg';
  }

  fotoUrl(folder: VoorstellingFolder, bestand: string): string {
    return this.client.directClient.files.getURL(folder, bestand, {
      token: this.fileToken() ?? undefined,
      thumb: '300x300',
    });
  }

  kies(bestand: string): void {
    const folder = this.gekozenFolder();
    if (folder) this.dialogRef.close({ folder, bestand });
  }
}
