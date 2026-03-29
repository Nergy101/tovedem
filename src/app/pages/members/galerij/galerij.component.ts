import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import { VoorstellingFolder } from '../../../models/domain/voorstelling-folder.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { FolderCardComponent } from './folder-card/folder-card.component';
import { FolderCreateDialogComponent } from './folder-create-dialog/folder-create-dialog.component';

type TabType = 'alle' | 'tovedem' | 'cloos' | 'mejotos';

@Component({
  selector: 'app-galerij',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    FolderCardComponent,
  ],
  templateUrl: './galerij.component.html',
  styleUrl: './galerij.component.scss',
})
export class GalerijComponent implements OnInit {
  private client = inject(PocketbaseService);
  private toastr = inject(ToastrService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  canCreateAlbum = computed(
    () =>
      this.authService.isGlobalAdmin ||
      this.authService.userHasAnyRole(['admin'])
  );

  loading = signal(false);
  fileToken = signal<string | null>(null);
  allFolders = signal<VoorstellingFolder[]>([]);
  activeTab = signal<TabType>('alle');

  // Filter folders based on active tab
  filteredFolders = computed(() => {
    const folders = this.allFolders();
    const tab = this.activeTab();

    if (tab === 'alle') {
      return folders;
    }

    // Map tab to groep prefix (first 3 chars of group name)
    const groepPrefixMap: Record<TabType, string> = {
      alle: '',
      tovedem: 'Tov',
      cloos: 'Clo',
      mejotos: 'Mej',
    };

    const prefix = groepPrefixMap[tab];

    return folders.filter((folder) => {
      // Get the groep name from the nested expand
      const groepNaam = folder.expand?.voorstelling?.expand?.groep?.naam;
      // Use includes like other components do for groep filtering
      return groepNaam && groepNaam.includes(prefix);
    });
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      this.fileToken.set(await this.client.getFileToken());

      const folders = (await this.client.directClient
        .collection('voorstellingen_folders')
        .getFullList({
          expand: 'voorstelling,voorstelling.groep',
          sort: '-voorstelling.datum_tijd_1,naam',
        })) as unknown as VoorstellingFolder[];

      this.allFolders.set(folders);
    } catch (error) {
      console.error('Error loading folders:', error);
      this.toastr.error('Fout bij het laden van de galerij');
    } finally {
      this.loading.set(false);
    }
  }

  onTabChange(index: number): void {
    const tabs: TabType[] = ['alle', 'tovedem', 'cloos', 'mejotos'];
    this.activeTab.set(tabs[index]);
  }

  async openCreateDialog(): Promise<void> {
    const dialogRef = this.dialog.open(FolderCreateDialogComponent);
    const result = await lastValueFrom(dialogRef.afterClosed());
    if (!result) return;

    // Reload folders so the new album appears immediately
    try {
      const folders = (await this.client.directClient
        .collection('voorstellingen_folders')
        .getFullList({
          expand: 'voorstelling,voorstelling.groep',
          sort: '-voorstelling.datum_tijd_1,naam',
        })) as unknown as VoorstellingFolder[];
      this.allFolders.set(folders);
      this.toastr.success('Album aangemaakt', 'Gelukt!');
    } catch {
      this.toastr.error('Fout bij herladen van de galerij');
    }
  }
}
