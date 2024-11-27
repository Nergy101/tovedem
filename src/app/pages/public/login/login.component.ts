import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { Gebruiker } from '../../../models/domain/gebruiker.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';

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

  seoService = inject(SeoService);

  pocketbase = inject(PocketbaseService);
  authService = inject(AuthService);
  router = inject(Router);

  get formIsValid(): boolean {
    return !!this.usernameOrEmail && !!this.password;
  }

  loading = signal(false);

  constructor() {
    this.seoService.update('Tovedem - Login');
  }

  async login(): Promise<void> {
    if (this.formIsValid) {
      this.loading.set(true);

      try {
        const authData = await this.pocketbase.client
          .collection('users')
          .authWithPassword(this.usernameOrEmail!, this.password!, {
            expand: 'groep,rollen',
          });

        if (!!authData) {
          this.authService.registerUser(authData.record as any as Gebruiker);
          this.router.navigate(['profiel']);
        }
      } catch {
        const authData = await this.pocketbase.client.collection("_superusers").authWithPassword(
          this.usernameOrEmail!,
          this.password!
        );

        console.log("Admin data", authData);
        if (!!authData.record) {
          this.authService.registerUser(authData.record as any as Gebruiker);
          this.router.navigate(['profiel']);
        }
      } finally {
        this.loading.set(false);
      }
    }
  }
}
