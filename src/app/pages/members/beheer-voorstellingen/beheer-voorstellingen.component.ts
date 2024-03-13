import { Component, WritableSignal, inject, signal } from '@angular/core';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { VoorstellingCreateEditDialogComponent } from './voorstelling-create-edit-dialog/voorstelling-create-edit-dialog.component';

@Component({
  selector: 'app-beheer-voorstellingen',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSelectModule, MatMenuModule],
  templateUrl: './beheer-voorstellingen.component.html',
  styleUrl: './beheer-voorstellingen.component.scss',
})
export class BeheerVoorstellingenComponent {
  loading = signal(false);

  items: WritableSignal<any[]> = signal([]);

  client = inject(PocketbaseService).client;
  dialog = inject(MatDialog);

  displayedColumns = ['id', 'naam', 'actions'];

  async ngOnInit(): Promise<void> {
    const items = (
      await this.client
        .collection('voorstellingen')
        .getList(0, 30, { expand: 'groep,spelers' })
    ).items as any[];

    this.items.set(items);
  }

  async openCreateDialog() {
    const dialogRef = this.dialog.open(VoorstellingCreateEditDialogComponent, {
      data: { existingVoorstelling: null },
      hasBackdrop: true,
      minHeight: '80vh',
      minWidth: '80vh',
      maxHeight: '80vh',
      maxWidth: '80vh',
      closeOnNavigation: false,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(async (_) => {
      await this.ngOnInit();
    });
  }

  async delete(element: any) {
    this.loading.set(true);
    await this.client.collection('voorstellingen').delete(element.id);

    this.items.update((x) => x!.filter((y: any) => y.id != element.id));
    this.loading.set(false);
  }
}
