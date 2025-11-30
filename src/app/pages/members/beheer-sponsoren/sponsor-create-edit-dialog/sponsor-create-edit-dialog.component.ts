import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatOption } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { Sponsor } from '../../../../models/domain/sponsor.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';

@Component({
  selector: 'app-sponsor-create-edit-dialog',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    FormsModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatOption,
  ],
  templateUrl: './sponsor-create-edit-dialog.component.html',
  styleUrl: './sponsor-create-edit-dialog.component.scss',
})
export class SponsorCreateEditDialogComponent implements OnInit {
  sponsor: Sponsor = {
    id: '',
    created: '',
    updated: '',
    voornaam: '',
    achternaam: '',
    type: 'vriend',
    email: '',
  };

  loading = signal(false);
  sponsorTypes: Array<'sponsor' | 'vriend' | 'ere-lid' | 'ere-mejoto'> = [
    'sponsor',
    'vriend',
    'ere-lid',
    'ere-mejoto',
  ];

  client = inject(PocketbaseService);
  dialogRef = inject(MatDialogRef<SponsorCreateEditDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  get isUpdate(): boolean {
    return !!this.data?.existingSponsor;
  }

  async ngOnInit(): Promise<void> {
    if (this.data?.existingSponsor) {
      const existing = this.data.existingSponsor;
      this.sponsor = { ...existing };
    }
  }

  async submit(): Promise<void> {
    this.loading.set(true);

    try {
      if (this.isUpdate) {
        const updated = await this.client.update<Sponsor>(
          'sponsoren',
          this.sponsor
        );
        this.dialogRef.close(updated);
      } else {
        const sponsorData = {
          voornaam: this.sponsor.voornaam,
          achternaam: this.sponsor.achternaam,
          type: this.sponsor.type,
          email: this.sponsor.email || '',
        };
        const created = await this.client.create<Sponsor>(
          'sponsoren',
          sponsorData
        );
        this.dialogRef.close(created);
      }
    } finally {
      this.loading.set(false);
    }
  }

  formIsValid(): boolean {
    return (
      !!this.sponsor.voornaam &&
      this.sponsor.voornaam.trim() !== '' &&
      !!this.sponsor.achternaam &&
      this.sponsor.achternaam.trim() !== '' &&
      !!this.sponsor.type
    );
  }

  getFieldErrors(field: any): string[] {
    const errors: string[] = [];
    if (field.errors) {
      if (field.errors['required']) {
        errors.push('Dit veld is verplicht');
      }
      if (field.errors['email']) {
        errors.push('Ongeldig e-mailadres');
      }
    }
    return errors;
  }
}

