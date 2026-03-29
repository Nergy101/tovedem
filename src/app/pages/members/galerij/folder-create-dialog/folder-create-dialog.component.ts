import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { ErrorService } from '../../../../shared/services/error.service';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';

@Component({
  selector: 'app-folder-create-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './folder-create-dialog.component.html',
  styleUrl: './folder-create-dialog.component.scss',
})
export class FolderCreateDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<FolderCreateDialogComponent>);
  private client = inject(PocketbaseService);
  private toastr = inject(ToastrService);
  private errorService = inject(ErrorService);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    naam: ['', Validators.required],
    jaar: [new Date().getFullYear()],
    voorstelling: [''],
  });

  loading = signal(false);
  loadingVoorstellingen = signal(true);
  voorstellingen = signal<Voorstelling[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      const list = (await this.client.directClient
        .collection('voorstellingen')
        .getFullList({
          sort: '-datum_tijd_1',
        })) as unknown as Voorstelling[];
      this.voorstellingen.set(list);
    } catch {
      // niet-kritiek: dropdown blijft leeg
    } finally {
      this.loadingVoorstellingen.set(false);
    }
  }

  getVoorstellingLabel(v: Voorstelling): string {
    const year = new Date(v.datum_tijd_1).getFullYear();
    return `${v.titel} (${year})`;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    const { naam, jaar, voorstelling } = this.form.getRawValue();

    this.loading.set(true);
    try {
      const data: Record<string, unknown> = { naam, fotos: [] };
      if (jaar) data['jaar'] = jaar;
      if (voorstelling) data['voorstelling'] = voorstelling;

      const created = await this.client.directClient
        .collection('voorstellingen_folders')
        .create(data);

      this.dialogRef.close(created);
    } catch (error) {
      this.toastr.error(
        this.errorService.getErrorMessage(error, 'Album aanmaken'),
        'Fout'
      );
    } finally {
      this.loading.set(false);
    }
  }
}
