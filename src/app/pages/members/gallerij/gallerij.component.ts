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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    MatProgressSpinnerModule,
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
  loading = signal(false);

  client = inject(PocketbaseService);

  page = signal<Page<Afbeelding> | null>(null);
  items = computed(() => this.page()?.items ?? []);
  fileToken = signal<string | null>(null);
  private initialized = signal(false);

  constructor() {
    effect(() => {
      // Skip effect on initial load - ngOnInit handles it
      if (!this.initialized()) return;
      
      const pageIndex = this.pageIndex();
      const pageSize = this.pageSize();
      
      this.loading.set(true);
      this.client.directClient.collection('afbeeldingen').getList(
        pageIndex,
        pageSize
      ).then((pbPage) => {
        const page = {
          page: pageIndex,
          perPage: pageSize,
          items: pbPage.items as unknown as Afbeelding[],
          totalItems: pbPage.totalItems,
          totalPages: pbPage.totalPages,
        } as Page<Afbeelding>;
        this.page.set(page);
        this.loading.set(false);
      }).catch((error) => {
        console.error('Error loading gallery page:', error);
        this.loading.set(false);
        // Don't rethrow - prevent global error handler from showing toast during loading
      });
    });
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      this.fileToken.set(await this.client.getFileToken());
      const pbPage = await this.client.directClient.collection('afbeeldingen').getList(
        this.pageIndex(),
        this.pageSize()
      );
      const page = {
        page: this.pageIndex(),
        perPage: this.pageSize(),
        items: pbPage.items as unknown as Afbeelding[],
        totalItems: pbPage.totalItems,
        totalPages: pbPage.totalPages,
      } as Page<Afbeelding>;
      this.page.set(page);
      this.initialized.set(true);
    } catch (error) {
      console.error('Error initializing gallery:', error);
      // Don't rethrow - prevent global error handler from showing toast during loading
    } finally {
      this.loading.set(false);
    }
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
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  getFileUrl(afbeelding: Afbeelding): string {
    if (!this.fileToken()) return 'assets/Place-Holder-Image.jpg';
    return this.client.directClient.files.getURL(afbeelding, afbeelding.bestand, {
      token: this.fileToken(),
      thumb: '100x100',
    });
  }
}
