import { Component, Inject, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import Speler from '../../../../models/domain/speler.model';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-beheer-spelers-update-dialog',
  standalone: true,
  imports: [MatDialogModule, FormsModule, MatInputModule, MatButtonModule],
  templateUrl: './beheer-spelers-update-dialog.component.html',
  styleUrl: './beheer-spelers-update-dialog.component.scss',
})
export class BeheerSpelersUpdateDialogComponent {
  dialogRef = inject(MatDialogRef<BeheerSpelersUpdateDialogComponent>);

  speler: Speler;

  constructor(@Inject(MAT_DIALOG_DATA) public data: Speler) {
    this.speler = data;
  }

  return(): void {
    this.dialogRef.close(this.speler);
  }
}
