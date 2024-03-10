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

  items: WritableSignal<any[] | null> = signal(null);

  client = inject(PocketbaseService).client;
  dialog = inject(MatDialog);

  displayedColumns = ['id', 'naam', 'actions'];

  async ngOnInit(): Promise<void> {
    const items = (
      await this.client
        .collection('voorstellingen')
        .getList(0, 30, { expand: 'groep,spelers' })
    ).items as any[];

    console.log(items);
    this.items.set(items);
  }

  async openCreateDialog() {
    const dialogRef = this.dialog.open(VoorstellingCreateEditDialogComponent, {
      data: { existingVoorstelling: null },
      hasBackdrop: true,
      minHeight: '80vh',
      minWidth: '80vh',
      closeOnNavigation: false,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
      // const formData = new FormData();

      // const fileInput = document.getElementById('fileInput');

      // // listen to file input changes and add the selected files to the form data
      // fileInput.addEventListener('change', function () {
      //   for (let file of fileInput.files) {
      //     formData.append('documents', file);
      //   }
      // });

      // // set some other regular text field value
      // formData.append('title', 'Hello world!');
      // this.client.collection('voorstellingen').create(result);
    });
  }

  async delete(element: any) {
    this.loading.set(true);
    await this.client.collection('voorstellingen').delete(element.id);

    this.items.update((x) => x!.filter((y: any) => y.id != element.id));
    this.loading.set(false);
  }
}
