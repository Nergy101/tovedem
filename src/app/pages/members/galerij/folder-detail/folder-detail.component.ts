import JSZip from 'jszip';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import { VoorstellingFolder } from '../../../../models/domain/voorstelling-folder.model';
import { ConfirmatieDialogComponent } from '../../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { AuthService } from '../../../../shared/services/auth.service';
import { ErrorService } from '../../../../shared/services/error.service';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { CancelViewportImageDirective } from '../../../../shared/directives/cancel-viewport-image.directive';
import { FolderPhotoPreviewDialogComponent } from './folder-photo-preview-dialog/folder-photo-preview-dialog.component';
import { FolderPhotoUploadDialogComponent } from './folder-photo-upload-dialog/folder-photo-upload-dialog.component';

@Component({
  selector: 'app-folder-detail',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    RouterModule,
    CancelViewportImageDirective,
  ],
  templateUrl: './folder-detail.component.html',
  styleUrl: './folder-detail.component.scss',
})
export class FolderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private client = inject(PocketbaseService);
  private dialog = inject(MatDialog);
  private toastr = inject(ToastrService);
  private errorService = inject(ErrorService);
  private authService = inject(AuthService);

  folder = signal<VoorstellingFolder | null>(null);
  loading = signal(true);
  fileToken = signal<string | null>(null);
  downloadingZip = signal(false);
  downloadProgress = signal<{
    current: number;
    total: number;
    phase: 'downloading' | 'zipping';
  } | null>(null);
  /** Filenames van foto's die al geladen zijn (voor spinner in kaart). */
  loadedPhotos = signal<Set<string>>(new Set());

  fotos = computed(() => {
    const folder = this.folder();
    if (!folder) {
      return [];
    }

    return [
      ...(folder.fotos ?? []),
      ...(folder.fotos_2 ?? []),
      ...(folder.fotos_3 ?? []),
      ...(folder.fotos_4 ?? []),
      ...(folder.fotos_5 ?? []),
    ];
  });

  canUpload = computed(() => {
    return (
      this.authService.isGlobalAdmin ||
      this.authService.userHasAnyRole(['admin', 'commissie'])
    );
  });

  canDelete = computed(() => {
    return (
      this.authService.isGlobalAdmin ||
      this.authService.userHasAnyRole(['admin', 'commissie'])
    );
  });

  canDeleteAlbum = computed(() => {
    return (
      this.authService.isGlobalAdmin ||
      this.authService.userHasAnyRole(['admin'])
    );
  });

  async ngOnInit(): Promise<void> {
    const folderId = this.route.snapshot.paramMap.get('folderId');
    if (!folderId) {
      this.router.navigate(['/galerij']);
      return;
    }

    this.loading.set(true);
    try {
      this.fileToken.set(await this.client.getFileToken());
      const folder = (await this.client.directClient
        .collection('voorstellingen_folders')
        .getOne(folderId, {
          expand: 'voorstelling',
        })) as unknown as VoorstellingFolder;
      this.folder.set(folder);
      this.loadedPhotos.set(new Set());
    } catch (error) {
      console.error('Error loading folder:', error);
      this.toastr.error('Fout bij het laden van de folder');
      this.router.navigate(['/galerij']);
    } finally {
      this.loading.set(false);
    }
  }

  markPhotoLoaded(filename: string): void {
    this.loadedPhotos.update((set) => new Set([...set, filename]));
  }

  markPhotoUnloaded(filename: string): void {
    this.loadedPhotos.update((set) => {
      const next = new Set(set);
      next.delete(filename);
      return next;
    });
  }

  getPhotoUrl(filename: string, thumb?: string): string {
    const token = this.fileToken();
    const folder = this.folder();
    if (!token || !folder) return 'assets/Place-Holder-Image.jpg';

    const options: { token: string; thumb?: string } = { token };
    if (thumb) {
      options.thumb = thumb;
    }

    return this.client.directClient.files.getURL(folder, filename, options);
  }

  downloadPhoto(filename: string): void {
    let url = this.getPhotoUrl(filename);
    if (url === 'assets/Place-Holder-Image.jpg') return;

    // Force download via PocketBase parameter
    url += url.includes('?') ? '&download=1' : '?download=1';

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
  }

  async openPhoto(filename: string): Promise<void> {
    const folder = this.folder();
    if (!folder) return;

    const currentIndex = this.fotos().indexOf(filename);
    const dialogRef = this.dialog.open(FolderPhotoPreviewDialogComponent, {
      data: {
        folder,
        filename,
        fileToken: this.fileToken(),
      },
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'fullscreen-dialog',
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    if (!result) return;

    if (result.action === 'next' && currentIndex < this.fotos().length - 1) {
      this.openPhoto(this.fotos()[currentIndex + 1]);
    } else if (result.action === 'previous' && currentIndex > 0) {
      this.openPhoto(this.fotos()[currentIndex - 1]);
    }
  }

  async openUploadDialog(): Promise<void> {
    const folder = this.folder();
    if (!folder) return;

    const dialogRef = this.dialog.open(FolderPhotoUploadDialogComponent, {
      data: { folder },
      disableClose: true,
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    if (result) {
      // Reload the folder to show the new photos
      this.loading.set(true);
      try {
        const updatedFolder = (await this.client.directClient
          .collection('voorstellingen_folders')
          .getOne(folder.id)) as unknown as VoorstellingFolder;
        this.folder.set(updatedFolder);
        this.loadedPhotos.set(new Set());
        this.toastr.success("Foto's succesvol toegevoegd", 'Gelukt!');
      } catch (error) {
        const errorMessage = this.errorService.getErrorMessage(
          error,
          'Folder laden'
        );
        this.toastr.error(errorMessage, 'Fout');
      } finally {
        this.loading.set(false);
      }
    }
  }

  async deletePhoto(filename: string): Promise<void> {
    const folder = this.folder();
    if (!folder) return;

    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Foto verwijderen',
        message: 'Weet je zeker dat je deze foto wilt verwijderen?',
      },
    });

    const dialogResult = await lastValueFrom(dialogRef.afterClosed());
    if (!dialogResult) return;

    this.loading.set(true);
    try {
      const formData = new FormData();

      // Remove from the correct column; PocketBase will ignore if not present
      formData.append('fotos-', filename);
      formData.append('fotos_2-', filename);
      formData.append('fotos_3-', filename);
      formData.append('fotos_4-', filename);
      formData.append('fotos_5-', filename);

      await this.client.directClient
        .collection('voorstellingen_folders')
        .update(folder.id, formData);

      // Reload folder
      const updatedFolder = (await this.client.directClient
        .collection('voorstellingen_folders')
        .getOne(folder.id)) as unknown as VoorstellingFolder;
      this.folder.set(updatedFolder);
      this.loadedPhotos.set(new Set());

      this.toastr.success('Foto succesvol verwijderd', 'Gelukt!');
    } catch (error) {
      const errorMessage = this.errorService.getErrorMessage(
        error,
        'Foto verwijderen'
      );
      this.toastr.error(errorMessage, 'Fout bij verwijderen');
    } finally {
      this.loading.set(false);
    }
  }

  async downloadAllAsZip(): Promise<void> {
    const folder = this.folder();
    const fotos = this.fotos();
    if (!folder || fotos.length === 0) return;

    const total = fotos.length;
    this.downloadingZip.set(true);
    this.downloadProgress.set({ current: 0, total, phase: 'downloading' });
    try {
      const zip = new JSZip();
      let completed = 0;
      await Promise.all(
        fotos.map(async (filename) => {
          const url = this.getPhotoUrl(filename);
          const response = await fetch(url);
          const blob = await response.blob();
          zip.file(filename, blob);
          this.downloadProgress.set({ current: ++completed, total, phase: 'downloading' });
        })
      );

      this.downloadProgress.set({ current: total, total, phase: 'zipping' });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipName = folder.jaar
        ? `${folder.naam} ${folder.jaar}.zip`
        : `${folder.naam}.zip`;

      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = zipName;
      a.click();
      URL.revokeObjectURL(a.href);

      this.toastr.success('Zip gedownload', 'Gelukt!');
    } catch {
      this.toastr.error('Fout bij het maken van de zip', 'Fout');
    } finally {
      this.downloadingZip.set(false);
      this.downloadProgress.set(null);
    }
  }

  async deleteAlbum(): Promise<void> {
    const folder = this.folder();
    if (!folder) return;

    const fotoCount = this.fotos().length;
    const dialogRef = this.dialog.open(ConfirmatieDialogComponent, {
      data: {
        title: 'Album verwijderen',
        message: `Weet je zeker dat je het album "${folder.naam}" wilt verwijderen? Dit verwijdert ook alle ${fotoCount} foto${fotoCount === 1 ? '' : "'s"}.`,
        confirmLabel: 'Verwijderen',
        confirmColor: 'warn',
      },
    });

    const result = await lastValueFrom(dialogRef.afterClosed());
    if (!result) return;

    try {
      await this.client.directClient
        .collection('voorstellingen_folders')
        .delete(folder.id);
      this.toastr.success('Album succesvol verwijderd', 'Gelukt!');
      this.router.navigate(['/galerij']);
    } catch (error) {
      const errorMessage = this.errorService.getErrorMessage(
        error,
        'Album verwijderen'
      );
      this.toastr.error(errorMessage, 'Fout');
    }
  }

  goBack(): void {
    this.router.navigate(['/galerij']);
  }
}
