import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Afbeelding } from '../../../../models/domain/afbeelding.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-image-preview-dialog',
  imports: [CommonModule, MatDialogModule, MatButton, MatIcon],
  templateUrl: './image-preview-dialog.component.html',
  styleUrl: './image-preview-dialog.component.scss',
})
export class ImagePreviewDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ImagePreviewDialogComponent>);
  data: { afbeelding: Afbeelding } = inject(MAT_DIALOG_DATA);
  client = inject(PocketbaseService);
  fileToken = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.fileToken.set(await this.client.getFileToken());
  }

  getFileUrl(): string {
    return this.client.client.files.getURL(
      this.data.afbeelding,
      this.data.afbeelding.bestand,
      {
        token: this.fileToken(),
      }
    );
  }

  downloadImage(): void {
    window.open(this.getFileUrl(), '_blank');
  }
}
