import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Reservering } from '../../../../models/domain/reservering.model';
import { Sponsor } from '../../../../models/domain/sponsor.model';

@Component({
  selector: 'app-verificatie-match-dialog',
  imports: [
    MatDialogModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './verificatie-match-dialog.component.html',
  styleUrl: './verificatie-match-dialog.component.scss',
})
export class VerificatieMatchDialogComponent {
  dialogRef = inject(MatDialogRef<VerificatieMatchDialogComponent>);
  data: {
    reservering: Reservering;
    matchingSponsors: Sponsor[];
    currentStatus?:
      | 'verified'
      | 'partial'
      | 'unverified'
      | 'verified_no_membership'
      | 'unverified_no_membership';
  } = inject(MAT_DIALOG_DATA);

  get reservering(): Reservering {
    return this.data.reservering;
  }

  get matchingSponsors(): Sponsor[] {
    return this.data.matchingSponsors;
  }

  get currentStatus():
    | 'verified'
    | 'partial'
    | 'unverified'
    | 'verified_no_membership'
    | 'unverified_no_membership' {
    return this.data.currentStatus || 'unverified';
  }

  get hasManualVerification(): boolean {
    return !!this.reservering.verificatie_status;
  }

  approve(sponsor: Sponsor): void {
    this.dialogRef.close({
      status: 'verified' as const,
      sponsorId: sponsor.id,
    });
  }

  reject(): void {
    this.dialogRef.close({
      status: 'unverified' as const,
      sponsorId: null,
    });
  }

  reset(): void {
    this.dialogRef.close({
      reset: true,
    });
  }

  confirmVriend(): void {
    this.dialogRef.close({
      confirmVriend: true,
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
