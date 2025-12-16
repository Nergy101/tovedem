import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ToastrService } from 'ngx-toastr';
import { VoorstellingFolder } from '../../../models/domain/voorstelling-folder.model';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { FolderCardComponent } from './folder-card/folder-card.component';

type TabType = 'alle' | 'tovedem' | 'cloos' | 'mejotos';

@Component({
  selector: 'app-gallerij',
  imports: [
    MatCardModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    FolderCardComponent,
  ],
  templateUrl: './gallerij.component.html',
  styleUrl: './gallerij.component.scss',
})
export class GallerijComponent implements OnInit {
  private client = inject(PocketbaseService);
  private toastr = inject(ToastrService);

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
          sort: '-jaar,naam',
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
}
