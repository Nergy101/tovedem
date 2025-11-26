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
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { Gebruiker } from '../../../models/domain/gebruiker.model';
import { Rol } from '../../../models/domain/rol.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';
import { SideDrawerService } from '../../../shared/services/side-drawer.service';

@Component({
    selector: 'app-login',
    imports: [
        CommonModule,
        MatInputModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        RouterModule,
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
  usernameOrEmail?: string;
  password?: string;
  hidePassword = signal(true);

  seoService = inject(SeoService);

  pocketbase = inject(PocketbaseService);
  authService = inject(AuthService);
  router = inject(Router);
  sideDrawerService = inject(SideDrawerService);

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

        if (authData) {
          this.authService.registerUser(authData.record as unknown as Gebruiker);
          
          // Only open side drawer if user is not just a 'bezoeker'
          const userRoles = (authData.record as unknown as Gebruiker).expand?.rollen?.map((r: Rol) => r.rol) || [];
          const isOnlyBezoeker = userRoles.length === 1 && userRoles[0] === 'bezoeker';
          
          if (!isOnlyBezoeker) {
            this.sideDrawerService.open();
          }
          
          this.router.navigate(['profiel']);
        }
      } catch {
        const authData = await this.pocketbase.client.collection("_superusers").authWithPassword(
          this.usernameOrEmail!,
          this.password!
        );

        if (authData.record) {
          this.authService.registerUser(authData.record as unknown as Gebruiker);
          this.sideDrawerService.open();
          this.router.navigate(['profiel']);
        }
      } finally {
        this.loading.set(false);
      }
    }
  }
}
