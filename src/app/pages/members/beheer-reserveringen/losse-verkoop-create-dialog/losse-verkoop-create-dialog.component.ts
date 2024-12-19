import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { LosseVerkoop } from '../../../../models/domain/losse-verkoop.model';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';

@Component({
  selector: 'app-losse-verkoop-create-dialog',
  imports: [
    CommonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    MatButton,
    MatIconButton
  ],
  templateUrl: './losse-verkoop-create-dialog.component.html',
  styleUrl: './losse-verkoop-create-dialog.component.scss'
})
export class LosseVerkoopCreateDialogComponent {
  client = inject(PocketbaseService);
  loading = signal(false);

  dialogRef = inject(MatDialogRef<LosseVerkoopCreateDialogComponent>);
  data: {voorstelling: Voorstelling} = inject(MAT_DIALOG_DATA);

  voorstelling = computed(() => this.data.voorstelling);

  aantal: number = 0;
  datumSelectOption: 'datum1' | 'datum2' | null = null;

  formIsValid(): boolean {
    return this.aantal > 0 && this.aantal <= 20 && this.datumSelectOption !== null;
  }

  async submit(): Promise<void> {
    console.log(this.aantal, this.datumSelectOption, this.voorstelling());

    if (!this.formIsValid()) return;
    
    const losseVerkoop = {
      aantal: this.aantal,
      datum: this.datumSelectOption!,
      voorstelling: this.data.voorstelling.id,
    };

    const createdLosseVerkoop = await this.client.create<LosseVerkoop>("losse_verkoop", losseVerkoop);

    this.dialogRef.close(createdLosseVerkoop);
  }
}
