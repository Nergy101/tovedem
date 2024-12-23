import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { lastValueFrom } from 'rxjs';
import { Afbeelding } from '../../../models/domain/afbeelding.model';
import { Page } from '../../../models/pocketbase/page.model';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { ImagePreviewDialogComponent } from './image-preview-dialog/image-preview-dialog.component';

@Component({
  selector: 'app-gallerij',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconButton,
    MatIcon,
    MatPaginatorModule,
  ],
  templateUrl: './gallerij.component.html',
  styleUrl: './gallerij.component.scss',
})
export class GallerijComponent implements OnInit {
  paginatorLength = computed(() => this.page()?.totalItems ?? 0);
  pageSize = signal(10);
  pageSizeOptions = signal([10, 20, 50, 100]);
  pageIndex = signal(0);
  dialog = inject(MatDialog);

  client = inject(PocketbaseService);

  page = signal<Page<Afbeelding> | null>(null);
  items = computed(() => this.page()?.items ?? []);
  fileToken = signal<string | null>(null);

  constructor() {
    effect(async () => {
      this.page.set(
        await this.client.getPage<Afbeelding>(
          'afbeeldingen',
          this.pageIndex(),
          this.pageSize()
        )
      );
    });
  }

  async ngOnInit(): Promise<void> {
    this.fileToken.set(await this.client.getFileToken());
    this.page.set(
      await this.client.getPage<Afbeelding>(
        'afbeeldingen',
        this.pageIndex(),
        this.pageSize()
      )
    );
  }

  async openImage(afbeelding: Afbeelding): Promise<void> {
    const dialogRef = this.dialog.open(ImagePreviewDialogComponent, {
      data: {
        afbeelding: afbeelding,
      },
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    if (!result) return;

    const currentAfbeeldingIndex = this.items().findIndex(
      (item) => item.id === afbeelding.id
    );

    if (result.action === 'next') {
      if (currentAfbeeldingIndex < this.items().length - 1) {
        this.openImage(this.items()[currentAfbeeldingIndex + 1]);
      }
    } else if (result.action === 'previous') {
      if (currentAfbeeldingIndex > 0) {
        this.openImage(this.items()[currentAfbeeldingIndex - 1]);
      }
    }
  }

  async onPageChange(event: PageEvent): Promise<void> {
    this.pageIndex.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
  }

  getFileUrl(afbeelding: Afbeelding): string {
    return this.client.client.files.getURL(afbeelding, afbeelding.bestand, {
      token: this.fileToken(),
      thumb: '100x100',
    });
  }
}
