import { Component, OnInit, inject, signal } from '@angular/core';
import { PocketbaseService } from '../../shared/services/pocketbase.service';
import { AuthService } from '../../shared/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  usernameOrEmail?: string;
  password?: string;

  pocketbase = inject(PocketbaseService).client;
  authService = inject(AuthService);

  get formIsValid(): boolean {
    return !!this.usernameOrEmail && !!this.password;
  }

  loading = signal(false);

  logout(): void {
    this.authService.unregisterUser();
  }

  async login(): Promise<void> {
    if (this.formIsValid) {
      this.loading.set(true);

      const authData = await this.pocketbase
        .collection('users')
        .authWithPassword(this.usernameOrEmail!, this.password!);

      this.authService.registerUser(authData);
    }

    this.loading.set(false);
  }
}