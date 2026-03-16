import { Component, inject, OnDestroy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { VoorstellingFolder } from '../../../../../models/domain/voorstelling-folder.model';
import { ErrorService } from '../../../../../shared/services/error.service';
import { PocketbaseService } from '../../../../../shared/services/pocketbase.service';

export interface FolderPhotoUploadData {
  folder: VoorstellingFolder;
}

interface SelectedFile {
  file: File;
  previewUrl: string;
}

/** PocketBase-achtig suffix: kleine letters/cijfers, meestal 8+ tekens. */
const PB_SUFFIX_REGEX = /^[a-z0-9]{6,}$/;

function normalizeFilename(name: string): string {
  const lower = name.toLowerCase();
  const lastDotIndex = lower.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return lower;
  }

  const base = lower.substring(0, lastDotIndex);
  const ext = lower.substring(lastDotIndex);
  const lastUnderscoreIndex = base.lastIndexOf('_');

  if (lastUnderscoreIndex === -1) {
    return base + ext;
  }

  const afterUnderscore = base.substring(lastUnderscoreIndex + 1);
  // Alleen strippen als het eruitziet als een PocketBase-idsuffix (bv. xtm737c7rw).
  // Zo blijft "img_5311" intact en matchen "img_5311.jpg" en "img_5311_xtm737c7rw.jpg".
  const normalizedBase = PB_SUFFIX_REGEX.test(afterUnderscore)
    ? base.substring(0, lastUnderscoreIndex)
    : base;

  return normalizedBase + ext;
}

@Component({
  selector: 'app-folder-photo-upload-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
  ],
  templateUrl: './folder-photo-upload-dialog.component.html',
  styleUrl: './folder-photo-upload-dialog.component.scss',
})
export class FolderPhotoUploadDialogComponent implements OnDestroy {
  dialogRef = inject(MatDialogRef<FolderPhotoUploadDialogComponent>);
  data: FolderPhotoUploadData = inject(MAT_DIALOG_DATA);
  client = inject(PocketbaseService);
  toastr = inject(ToastrService);
  errorService = inject(ErrorService);

  loading = signal(false);
  uploadProgress = signal(0);
  selectedFiles = signal<SelectedFile[]>([]);
  totalToUpload = signal(0);
  duplicatesSkipped = signal(0);
  uploadedCount = signal(0);

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles: SelectedFile[] = [];

      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const previewUrl = URL.createObjectURL(file);
        newFiles.push({ file, previewUrl });
      }

      this.selectedFiles.update((current) => [...current, ...newFiles]);
    }
    // Reset input so the same files can be selected again if needed
    input.value = '';
  }

  removeFile(index: number): void {
    const files = this.selectedFiles();
    if (files[index]) {
      URL.revokeObjectURL(files[index].previewUrl);
    }
    this.selectedFiles.update((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  async submit(): Promise<void> {
    const files = this.selectedFiles();
    if (files.length === 0) {
      this.toastr.error("Selecteer eerst één of meer foto's", 'Fout', {
        positionClass: 'toast-bottom-right',
      });
      return;
    }

    this.loading.set(true);
    this.uploadProgress.set(0);
    this.totalToUpload.set(0);
    this.duplicatesSkipped.set(0);
    this.uploadedCount.set(0);

    try {
      // Bepaal alle bestaande bestandsnamen (alle kolommen), genormaliseerd zodat
      // img_5311.jpg en img_5311_xtm737c7rw.jpg als dezelfde worden gezien.
      const existingNames = new Set<string>(
        [
          ...(this.data.folder.fotos ?? []),
          ...(this.data.folder.fotos_2 ?? []),
          ...(this.data.folder.fotos_3 ?? []),
          ...(this.data.folder.fotos_4 ?? []),
          ...(this.data.folder.fotos_5 ?? []),
        ].map((name) => normalizeFilename(name))
      );

      // Filter dubbele bestandsnamen weg (zowel t.o.v. bestaande als binnen de selectie)
      const uniqueToUpload: SelectedFile[] = [];
      const seenThisBatch = new Set<string>();

      for (const f of files) {
        const name = normalizeFilename(f.file.name);
        if (existingNames.has(name) || seenThisBatch.has(name)) {
          this.duplicatesSkipped.update((current) => current + 1);
          continue;
        }
        seenThisBatch.add(name);
        uniqueToUpload.push(f);
      }

      if (uniqueToUpload.length === 0) {
        this.toastr.info(
          'Alle geselecteerde foto\'s staan al in deze folder',
          'Geen nieuwe foto\'s',
          { positionClass: 'toast-bottom-right' }
        );
        this.loading.set(false);
        return;
      }

      const total = uniqueToUpload.length;
      this.totalToUpload.set(total);

      // Aantal bestanden in de folder (som van alle kolommen); bepalend voor welke kolom we gebruiken.
      // Gebruik geen existingNames.size: bij dubbele bestandsnamen zou die te laag zijn.
      const existingCount =
        (this.data.folder.fotos?.length ?? 0) +
        (this.data.folder.fotos_2?.length ?? 0) +
        (this.data.folder.fotos_3?.length ?? 0) +
        (this.data.folder.fotos_4?.length ?? 0) +
        (this.data.folder.fotos_5?.length ?? 0);

      for (let index = 0; index < total; index++) {
        const selectedFile = uniqueToUpload[index];
        const formData = new FormData();

        const overallIndex = existingCount + index;
        const columnSize = 99;
        const columnIndex = Math.floor(overallIndex / columnSize); // 0..4

        let fieldName = 'fotos+';
        if (columnIndex === 1) {
          fieldName = 'fotos_2+';
        } else if (columnIndex === 2) {
          fieldName = 'fotos_3+';
        } else if (columnIndex === 3) {
          fieldName = 'fotos_4+';
        } else if (columnIndex === 4) {
          fieldName = 'fotos_5+';
        }

        formData.append(fieldName, selectedFile.file, selectedFile.file.name);

        await this.client.directClient
          .collection('voorstellingen_folders')
          .update(this.data.folder.id, formData);

        const uploaded = index + 1;
        this.uploadedCount.set(uploaded);
        const progress = Math.round((uploaded / total) * 100);
        this.uploadProgress.set(progress);
      }

      this.toastr.success(
        `${total} foto${total > 1 ? "'s" : ''} succesvol toegevoegd`,
        'Gelukt!',
        { positionClass: 'toast-bottom-right' }
      );

      this.dialogRef.close(true);
    } catch (error: unknown) {
      const errorMessage = this.errorService.getErrorMessage(
        error,
        "Foto's uploaden"
      );
      this.toastr.error(errorMessage, 'Fout bij uploaden', {
        positionClass: 'toast-bottom-right',
        timeOut: 7000,
      });
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    // Clean up all object URLs to prevent memory leaks
    for (const file of this.selectedFiles()) {
      URL.revokeObjectURL(file.previewUrl);
    }
  }
}
