
import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom, debounceTime, tap } from 'rxjs';
import { Sponsor } from '../../../models/domain/sponsor.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SponsorCreateEditDialogComponent } from './sponsor-create-edit-dialog/sponsor-create-edit-dialog.component';
import { ConfirmatieDialogComponent } from '../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { ThemeService } from '../../../shared/services/theme.service';

@Component({
  selector: 'app-beheer-sponsoren',
  imports: [
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule
],
  templateUrl: './beheer-sponsoren.component.html',
  styleUrl: './beheer-sponsoren.component.scss',
})
export class BeheerSponsorenComponent implements OnInit {
  loading = signal(false);
  sponsors: WritableSignal<Sponsor[] | null> = signal(null);

  client = inject(PocketbaseService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);
  themeService = inject(ThemeService);
  titleService = inject(Title);

  searching = signal(false);
  searchTerm = signal('');
  searchTerm$ = toObservable(this.searchTerm);

  constructor() {
    this.titleService.setTitle('Tovedem - Beheer - Sponsoren');

    this.searchTerm$
      .pipe(
        tap(() => this.searching.set(true)),
        debounceTime(500),
        takeUntilDestroyed()
      )
      .subscribe(async (newSearchTerm: string) => {
        await this.loadSponsors(newSearchTerm);
        this.searching.set(false);
      });
  }

  async ngOnInit(): Promise<void> {
    await this.loadSponsors();
  }

  private async loadSponsors(searchTerm?: string): Promise<void> {
    try {
      if (!searchTerm || searchTerm === '') {
        this.sponsors.set(
          await this.client.directClient.collection('sponsoren').getFullList()
        );
      } else {
        this.sponsors.set(
          await this.client.directClient.collection('sponsoren').getFullList({
            filter: this.client.directClient.filter(
              'voornaam ~ {:search} || achternaam ~ {:search} || email ~ {:search} || type ~ {:search}',
              {
                search: searchTerm,
              }
            ),
          })
        );
      }
    } catch (error) {
      console.error('Error loading sponsors:', error);
      this.toastr.error('Fout bij het laden van sponsoren');
    }
  }

  onSearchTermChanged(newValue: string): void {
    this.searchTerm.set(newValue);
  }

  async openCreateDialog(): Promise<void> {
    const dialogRef = this.dialog.open(SponsorCreateEditDialogComponent, {
      data: { existingSponsor: null },
      hasBackdrop: true,
      minWidth: '50vw',
    });

    const created: Sponsor = await lastValueFrom(dialogRef.afterClosed());

    if (created) {
      this.toastr.success(`Sponsor ${created.voornaam} ${created.achternaam} aangemaakt.`);
      await this.loadSponsors(this.searchTerm());
    }
  }

  async openEditDialog(sponsor: Sponsor): Promise<void> {
    const dialogRef = this.dialog.open(SponsorCreateEditDialogComponent, {
      data: { existingSponsor: sponsor },
      hasBackdrop: true,
      minWidth: '50vw',
    });

    const edited: Sponsor = await lastValueFrom(dialogRef.afterClosed());

    if (edited) {
      this.toastr.success(`Sponsor ${edited.voornaam} ${edited.achternaam} aangepast.`);
      await this.loadSponsors(this.searchTerm());
    }
  }

  async delete(id: string): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Sponsor verwijderen',
        message: 'Weet je zeker dat je deze sponsor wilt verwijderen?',
      },
    });

    const dialogResult = await lastValueFrom(dialogRef.afterClosed());

    if (!dialogResult) return;

    this.loading.set(true);

    try {
      if (await this.client.delete('sponsoren', id)) {
        this.sponsors.update((x) => x!.filter((y: Sponsor) => y.id != id));
        this.toastr.success('Sponsor verwijderd.');
      }
    } catch (error) {
      console.error('Error deleting sponsor:', error);
      this.toastr.error('Fout bij het verwijderen van sponsor');
    } finally {
      this.loading.set(false);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.parseAndUploadCSV(file);
      // Reset file input to allow selecting the same file again
      input.value = '';
    }
  }

  private async parseAndUploadCSV(file: File): Promise<void> {
    this.loading.set(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim() !== '');
      
      if (lines.length < 2) {
        this.toastr.error('CSV bestand is leeg of ongeldig');
        return;
      }

      // Skip header row
      const dataLines = lines.slice(1);
      const sponsorsToCreate: Partial<Sponsor>[] = [];

      for (const line of dataLines) {
        // Parse CSV line (tab-separated based on the example)
        const columns = this.parseCSVLine(line);
        
        if (columns.length < 6) {
          continue; // Skip invalid rows
        }

        const voornaam = columns[0]?.trim() || '';
        const tussenvoegsel = columns[1]?.trim() || '';
        const achternaam = columns[2]?.trim() || '';
        const functie = columns[3]?.trim() || '';
        const email = columns[5]?.trim() || '';

        if (!voornaam || !achternaam) {
          continue; // Skip rows without required fields
        }

        // Handle multiple names (e.g., "Piet en Marianne")
        const names = this.splitMultipleNames(voornaam);
        const normalizedType = this.normalizeType(functie);
        const fullAchternaam = tussenvoegsel
          ? `${tussenvoegsel} ${achternaam}`.trim()
          : achternaam;

        // Create a record for each name
        for (const name of names) {
          sponsorsToCreate.push({
            voornaam: name.trim(),
            achternaam: fullAchternaam,
            type: normalizedType,
            email: email,
          });
        }
      }

      if (sponsorsToCreate.length === 0) {
        this.toastr.warning('Geen geldige sponsoren gevonden in CSV');
        return;
      }

      // Batch create sponsors
      let successCount = 0;
      let errorCount = 0;

      for (const sponsorData of sponsorsToCreate) {
        try {
          await this.client.create<Sponsor>('sponsoren', sponsorData);
          successCount++;
        } catch (error) {
          console.error('Error creating sponsor:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        this.toastr.success(`${successCount} sponsor(en) toegevoegd.`);
      }
      if (errorCount > 0) {
        this.toastr.warning(`${errorCount} sponsor(en) konden niet worden toegevoegd.`);
      }

      // Reload sponsors
      await this.loadSponsors(this.searchTerm());
    } catch (error) {
      console.error('Error parsing CSV:', error);
      this.toastr.error('Fout bij het verwerken van CSV bestand');
    } finally {
      this.loading.set(false);
    }
  }

  private parseCSVLine(line: string): string[] {
    // Handle tab-separated CSV
    const columns: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === '\t' && !inQuotes) {
        columns.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    columns.push(current); // Add last column

    return columns.map((col) => col.trim().replace(/^"|"$/g, ''));
  }

  private splitMultipleNames(voornaam: string): string[] {
    // Split names like "Piet en Marianne" or "Ge en Werner"
    if (voornaam.toLowerCase().includes(' en ')) {
      return voornaam.split(/ en /i).map((name) => name.trim());
    }
    return [voornaam];
  }

  private normalizeType(functie: string): 'sponsor' | 'vriend' | 'ere-lid' | 'ere-mejoto' {
    const normalized = functie.toLowerCase().trim();

    if (normalized.includes('sponsor')) {
      return 'sponsor';
    }
    if (normalized.includes('ere-mej') || normalized.includes('ere mej')) {
      return 'ere-mejoto';
    }
    if (normalized.includes('ere-lid') || normalized.includes('erelid')) {
      return 'ere-lid';
    }
    if (normalized.includes('vriend')) {
      return 'vriend';
    }

    // Default to 'vriend' if no match
    return 'vriend';
  }

  getPrimaryTintColor(): string {
    return 'rgba(125, 179, 232, 0.3)';
  }
}

