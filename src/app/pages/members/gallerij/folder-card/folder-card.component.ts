import { Component, computed, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { VoorstellingFolder } from '../../../../models/domain/voorstelling-folder.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';

@Component({
  selector: 'app-folder-card',
  imports: [MatCardModule],
  templateUrl: './folder-card.component.html',
  styleUrl: './folder-card.component.scss',
})
export class FolderCardComponent {
  folder = input.required<VoorstellingFolder>();
  fileToken = input<string | null>(null);

  private client = inject(PocketbaseService);
  private router = inject(Router);

  // Get first 3 photos for the stack effect
  stackPhotos = computed(() => {
    const fotos = this.folder().fotos || [];
    return fotos.slice(0, 3);
  });

  hasPhotos = computed(() => this.stackPhotos().length > 0);

  photoCount = computed(() => this.folder().fotos?.length ?? 0);

  getPhotoUrl(filename: string, index: number): string {
    const token = this.fileToken();
    if (!token) return 'assets/Place-Holder-Image.jpg';

    return this.client.directClient.files.getURL(this.folder(), filename, {
      token,
      thumb: '200x150',
    });
  }

  navigateToFolder(): void {
    this.router.navigate(['/gallerij', this.folder().id]);
  }
}
