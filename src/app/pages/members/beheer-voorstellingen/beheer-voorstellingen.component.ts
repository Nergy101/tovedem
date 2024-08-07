import { Component, WritableSignal, inject, signal } from '@angular/core';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { VoorstellingCreateEditDialogComponent } from './voorstelling-create-edit-dialog/voorstelling-create-edit-dialog.component';
import { ToastrService } from 'ngx-toastr';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Voorstelling from '../../../models/domain/voorstelling.model';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-beheer-voorstellingen',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './beheer-voorstellingen.component.html',
  styleUrl: './beheer-voorstellingen.component.scss',
})
export class BeheerVoorstellingenComponent {
  loading = signal(false);

  items: WritableSignal<any[] | null> = signal(null);

  client = inject(PocketbaseService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  toastr = inject(ToastrService);

  titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('Tovedem - Beheer - Voorstellingen');
  }

  async ngOnInit(): Promise<void> {
    this.items.set(
      await this.client.getAll<Voorstelling>('voorstellingen', {
        expand: 'groep,spelers',
      })
    );
  }

  async openCreateDialog() {
    const dialogRef = this.dialog.open(VoorstellingCreateEditDialogComponent, {
      data: { existingVoorstelling: null },
      hasBackdrop: true,
    });
  
    const created: Voorstelling = await lastValueFrom(dialogRef.afterClosed());

    if (!!created) {
      this.toastr.success(`Voorstelling ${created.titel} aangemaakt.`);
      await this.ngOnInit();
    }
  }

  async openEditDialog(use_voorstelling : Voorstelling) {
    const dialogRef = this.dialog.open(VoorstellingCreateEditDialogComponent, {
      data: { existingVoorstelling: use_voorstelling },
      hasBackdrop: true,
    });
  
    const created: Voorstelling = await lastValueFrom(dialogRef.afterClosed());

    if (!!created) {
      this.toastr.success(`Voorstelling ${created.titel} aangepast.`);
      await this.ngOnInit();
    }
  }


  async delete({ id }: any) {
    this.loading.set(true);

    if (await this.client.delete('voorstellingen', id)) {
      this.items.update((x) => x!.filter((y: any) => y.id != id));
    }

    this.loading.set(false);
  }
}
