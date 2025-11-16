import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-required-dialog',
  imports: [MatDialogModule, CommonModule, MatButton],
  templateUrl: './login-required-dialog.component.html',
  styleUrls: ['./login-required-dialog.component.scss'],
})
export class LoginRequiredDialogComponent {
  dialogRef = inject(MatDialogRef<LoginRequiredDialogComponent>);
  router = inject(Router);

  close(): void {
    this.dialogRef.close();
  }

  navigateToLogin(): void {
    this.dialogRef.close();
    this.router.navigate(['/login']);
  }

  navigateToSignup(): void {
    this.dialogRef.close();
    this.router.navigate(['/signup']);
  }
}

