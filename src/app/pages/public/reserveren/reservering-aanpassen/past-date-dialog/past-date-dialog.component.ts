import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-past-date-dialog',
  imports: [MatDialogModule, CommonModule, MatButton],
  templateUrl: './past-date-dialog.component.html',
  styleUrls: ['./past-date-dialog.component.scss'],
})
export class PastDateDialogComponent {
  dialogRef = inject(MatDialogRef<PastDateDialogComponent>);
  router = inject(Router);

  close(): void {
    this.dialogRef.close();
    this.router.navigate(['/']);
  }
}

