
import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Nieuws } from '../../../../models/domain/nieuws.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';

@Component({
  selector: 'app-nieuws-image-dialog',
  imports: [
    MatDialogModule,
    MatButton,
    MatProgressSpinner,
    MatIcon
],
  templateUrl: './nieuws-image-dialog.component.html',
  styleUrl: './nieuws-image-dialog.component.scss',
})
export class NieuwsImageDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<NieuwsImageDialogComponent>);
  data: { nieuws: Nieuws } = inject(MAT_DIALOG_DATA);
  client = inject(PocketbaseService);
  fileToken = signal<string | null>(null);
  loading = signal<boolean>(true);

  async ngOnInit(): Promise<void> {
    this.fileToken.set(await this.client.getFileToken());
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onEscapeDown();
    } else if (event.key === 'Enter') {
      this.onEnterDown();
    }
  }

  onEnterDown(): void {
    this.openImageInNewTab();
  }

  onEscapeDown(): void {
    this.dialogRef.close();
  }

  getFileUrl(): string {
    if (!this.data.nieuws.afbeelding) {
      return 'assets/Place-Holder-Image.jpg';
    }
    if (!this.fileToken()) {
      return 'assets/Place-Holder-Image.jpg';
    }
    return this.client.directClient.files.getURL(
      this.data.nieuws,
      this.data.nieuws.afbeelding,
      {
        token: this.fileToken(),
      }
    );
  }

  openImageInNewTab(): void {
    window.open(this.getFileUrl(), '_blank');
  }
}


