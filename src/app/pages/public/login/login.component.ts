
import {
  Component,
  inject,
  signal,
} from '@angular/core';
import { Field, form, required, debounce } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { Gebruiker } from '../../../models/domain/gebruiker.model';
import { Rol } from '../../../models/domain/rol.model';
import { LoginFormModel } from '../../../models/form-models/login-form.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';
import { SideDrawerService } from '../../../shared/services/side-drawer.service';

@Component({
    selector: 'app-login',
    imports: [
    MatInputModule,
    Field,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule,
    RouterModule
],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
  // Signal Forms: Create form model and form instance
  // NOTE: Signal Forms are experimental in Angular 21
  loginModel = signal<LoginFormModel>({
    usernameOrEmail: '',
    password: ''
  });

  loginForm = form(this.loginModel, (schemaPath) => {
    debounce(schemaPath.usernameOrEmail, 500);
    debounce(schemaPath.password, 500);
    required(schemaPath.usernameOrEmail, { message: 'E-mail of gebruikersnaam is verplicht' });
    required(schemaPath.password, { message: 'Wachtwoord is verplicht' });
  });

  hidePassword = signal(true);

  seoService = inject(SeoService);

  pocketbase = inject(PocketbaseService);
  authService = inject(AuthService);
  router = inject(Router);
  sideDrawerService = inject(SideDrawerService);

  loading = signal(false);

  constructor() {
    this.seoService.update('Tovedem - Login');
  }

  async login(): Promise<void> {
    if (this.loginForm().valid()) {
      this.loading.set(true);
      const formData = this.loginModel();

      try {
        const authData = await this.pocketbase.client
          .collection('users')
          .authWithPassword(formData.usernameOrEmail, formData.password, {
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
        const formData = this.loginModel();
        const authData = await this.pocketbase.client.collection("_superusers").authWithPassword(
          formData.usernameOrEmail,
          formData.password
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
