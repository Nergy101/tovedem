import {
  Component,
  OnInit,
  Signal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { AuthService } from '../../../shared/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import Gebruiker from '../../../models/domain/gebruiker.model';

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

  pocketbase = inject(PocketbaseService);
  authService = inject(AuthService);
  router = inject(Router);
  titleService = inject(Title);

  get formIsValid(): boolean {
    return !!this.usernameOrEmail && !!this.password;
  }

  loading = signal(false);

  constructor() {
    this.titleService.setTitle('Tovedem - Login');
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
        const authData = await this.pocketbase.client.admins.authWithPassword(
          this.usernameOrEmail!,
          this.password!
        );

        if (!!authData?.admin) {
          this.authService.registerUser(authData.admin);
          this.router.navigate(['profiel']);
        }
      } finally {
        this.loading.set(false);
      }
    }
  }
}
