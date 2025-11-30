import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LosseVerkoop } from '../../../../models/domain/losse-verkoop.model';
import { Voorstelling } from '../../../../models/domain/voorstelling.model';
import { Reservering } from '../../../../models/domain/reservering.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { ConfirmatieDialogComponent } from '../../../../shared/components/confirmatie-dialog/confirmatie-dialog.component';

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
    MatIconButton,
  ],
  templateUrl: './losse-verkoop-create-dialog.component.html',
  styleUrl: './losse-verkoop-create-dialog.component.scss',
})
export class LosseVerkoopCreateDialogComponent {
  client = inject(PocketbaseService);
  dialog = inject(MatDialog);
  loading = signal(false);

  dialogRef = inject(MatDialogRef<LosseVerkoopCreateDialogComponent>);
  data: { voorstelling: Voorstelling; selectedDag: 'datum1' | 'datum2' } = inject(MAT_DIALOG_DATA);

  voorstelling = computed(() => this.data.voorstelling);
  selectedDag = computed(() => this.data.selectedDag);

  aantal: number | null = null;


  getSelectedDatum(): Date {
    const dag = this.selectedDag();
    if (dag === 'datum1') {
      return new Date(this.voorstelling()?.datum_tijd_1 ?? new Date());
    } else {
      return new Date(this.voorstelling()?.datum_tijd_2 ?? new Date());
    }
  }

  formIsValid(): boolean {
    return (
      this.aantal !== null && this.aantal > 0 && this.aantal <= 20
    );
  }

  getFieldErrors(field: any): string[] {
    const errors: string[] = [];
    if (field.errors) {
      if (field.errors['required']) {
        errors.push('Aantal is verplicht');
      }
      if (field.errors['min']) {
        errors.push('Aantal moet minimaal 1 zijn');
      }
      if (field.errors['max']) {
        errors.push('Aantal mag maximaal 20 zijn');
      }
    }
    return errors;
  }

  async getTotalTickets(): Promise<number> {
    const voorstelling = this.voorstelling();
    const selectedDag = this.selectedDag();
    const nieuweAantal = this.aantal ?? 0;

    // Get beschikbare stoelen for selected day
    const beschikbareStoelen = selectedDag === 'datum1' 
      ? voorstelling.beschikbare_stoelen_datum_tijd_1 
      : voorstelling.beschikbare_stoelen_datum_tijd_2;

    // Get all reservations for this voorstelling
    const reserveringen = await this.client.getAll<Reservering>('reserveringen', {
      filter: `voorstelling = "${voorstelling.id}"`,
    });

    // Calculate total reservations for selected day
    let totalReserveringen = 0;
    reserveringen.forEach((reservering) => {
      if (selectedDag === 'datum1') {
        totalReserveringen += reservering.datum_tijd_1_aantal;
      } else {
        totalReserveringen += reservering.datum_tijd_2_aantal;
      }
    });

    // Get all losse verkoop for this voorstelling and day
    const losseVerkoop = await this.client.getAll<LosseVerkoop>('losse_verkoop', {
      filter: `voorstelling = "${voorstelling.id}" && datum = "${selectedDag}"`,
    });

    // Calculate total losse verkoop
    let totalLosseVerkoop = 0;
    losseVerkoop.forEach((lv) => {
      totalLosseVerkoop += lv.aantal;
    });

    // Total = reservations + existing losse verkoop + new losse verkoop
    return totalReserveringen + totalLosseVerkoop + nieuweAantal;
  }

  async submit(): Promise<void> {
    if (!this.formIsValid()) return;

    const voorstelling = this.voorstelling();
    const selectedDag = this.selectedDag();
    const beschikbareStoelen = selectedDag === 'datum1' 
      ? voorstelling.beschikbare_stoelen_datum_tijd_1 
      : voorstelling.beschikbare_stoelen_datum_tijd_2;

    // Check if total would exceed beschikbare stoelen
    const totalTickets = await this.getTotalTickets();
    
    if (totalTickets > beschikbareStoelen) {
      // Show confirmation dialog
      const confirmDialogRef = this.dialog.open(ConfirmatieDialogComponent, {
        data: {
          title: 'Waarschuwing',
          message: 'Weet je zeker dat je over de ingestelde stoelenlimiet heen wil?',
        },
      });

      const confirmed = await confirmDialogRef.afterClosed().toPromise();
      
      if (!confirmed) {
        // User cancelled, don't proceed
        return;
      }
    }

    this.loading.set(true);

    try {
      const losseVerkoop = {
        aantal: this.aantal!,
        datum: this.selectedDag(),
        voorstelling: this.data.voorstelling.id,
      };

      const createdLosseVerkoop = await this.client.create<LosseVerkoop>(
        'losse_verkoop',
        losseVerkoop
      );

      this.dialogRef.close(createdLosseVerkoop);
    } finally {
      this.loading.set(false);
    }
  }
}
