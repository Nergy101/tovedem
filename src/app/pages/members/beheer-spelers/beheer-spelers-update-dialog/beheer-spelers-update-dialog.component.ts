import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { Speler } from '../../../../models/domain/speler.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-beheer-spelers-update-dialog',
    imports: [MatDialogModule, FormsModule, MatInputModule, MatButtonModule, MatIconModule],
    templateUrl: './beheer-spelers-update-dialog.component.html',
    styleUrl: './beheer-spelers-update-dialog.component.scss'
})
export class BeheerSpelersUpdateDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<BeheerSpelersUpdateDialogComponent>);
  dialogData: Speler = inject(MAT_DIALOG_DATA);

  speler!: Speler;

  ngOnInit(): void {
    this.speler = this.dialogData;
  }

  return(): void {
    this.dialogRef.close(this.speler);
  }

  formIsValid(): boolean {
    return !!this.speler.naam && this.speler.naam.trim() !== '';
  }

  getFieldErrors(field: any): string[] {
    const errors: string[] = [];
    if (field.errors) {
      if (field.errors['required']) {
        errors.push('Speler naam is verplicht');
      }
    }
    return errors;
  }
}
