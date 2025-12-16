import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import { VoorstellingFolder } from '../../../../models/domain/voorstelling-folder.model';
import { ConfirmatieDialogComponent } from '../../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';
import { AuthService } from '../../../../shared/services/auth.service';
import { ErrorService } from '../../../../shared/services/error.service';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { FolderPhotoPreviewDialogComponent } from './folder-photo-preview-dialog/folder-photo-preview-dialog.component';
import { FolderPhotoUploadDialogComponent } from './folder-photo-upload-dialog/folder-photo-upload-dialog.component';

@Component({
  selector: 'app-folder-detail',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule,
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

  fotos = computed(() => this.folder()?.fotos ?? []);

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
    } catch (error) {
      console.error('Error loading folder:', error);
      this.toastr.error('Fout bij het laden van de folder');
      this.router.navigate(['/galerij']);
    } finally {
      this.loading.set(false);
    }
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
      // Remove the photo from the fotos array
      const updatedFotos = folder.fotos.filter((f) => f !== filename);

      // Update the folder with the new fotos array
      // We need to use FormData to properly handle the file removal
      const formData = new FormData();
      formData.append('fotos-', filename); // The minus sign tells PocketBase to remove this file

      await this.client.directClient
        .collection('voorstellingen_folders')
        .update(folder.id, formData);

      // Reload folder
      const updatedFolder = (await this.client.directClient
        .collection('voorstellingen_folders')
        .getOne(folder.id)) as unknown as VoorstellingFolder;
      this.folder.set(updatedFolder);

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

  goBack(): void {
    this.router.navigate(['/galerij']);
  }
}
