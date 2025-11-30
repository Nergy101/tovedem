import { Component, inject, signal } from '@angular/core';
import {
  Field,
  form,
  required,
  email,
  minLength,
  pattern,
  debounce,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Gebruiker } from '../../../models/domain/gebruiker.model';
import { Rol } from '../../../models/domain/rol.model';
import { SignupFormModel } from '../../../models/form-models/signup-form.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';
import { SideDrawerService } from '../../../shared/services/side-drawer.service';
import { ErrorService } from '../../../shared/services/error.service';

@Component({
  selector: 'app-signup',
  imports: [
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    Field,
    RouterModule,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  // Signal Forms: Create form model and form instance
  // NOTE: Signal Forms are experimental in Angular 21
  signupModel = signal<SignupFormModel>({
    username: '',
    email: '',
    name: '',
    password: '',
    passwordConfirm: '',
  });

  signupForm = form(this.signupModel, (schemaPath) => {
    debounce(schemaPath.username, 500);
    debounce(schemaPath.email, 500);
    debounce(schemaPath.name, 500);
    debounce(schemaPath.password, 500);
    debounce(schemaPath.passwordConfirm, 500);
    required(schemaPath.username);
    pattern(schemaPath.username, /^[a-zA-Z0-9_-]+$/, {
      message:
        'Gebruikersnaam mag alleen letters, cijfers, underscores en streepjes bevatten',
    });
    required(schemaPath.email);
    email(schemaPath.email);
    required(schemaPath.name);
    required(schemaPath.password);
    minLength(schemaPath.password, 8, {
      message: 'Wachtwoord moet minimaal 8 tekens lang zijn',
    });
    required(schemaPath.passwordConfirm);
    // Custom validator for password match
    validate(schemaPath.passwordConfirm, ({ value, valueOf }) => {
      const confirmPassword = value();
      const password = valueOf(schemaPath.password);
      if (confirmPassword !== password && confirmPassword.length > 0) {
        return {
          kind: 'passwordMismatch',
          message: 'De wachtwoorden komen niet overeen',
        };
      }
      return null;
    });
  });

  hidePassword = signal(true);
  hidePasswordConfirm = signal(true);

  seoService = inject(SeoService);
  pocketbase = inject(PocketbaseService);
  authService = inject(AuthService);
  errorService = inject(ErrorService);
  router = inject(Router);
  sideDrawerService = inject(SideDrawerService);
  toastr = inject(ToastrService);

  loading = signal(false);

  constructor() {
    this.seoService.update('Tovedem - Account Aanmaken');
  }

  async signup(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (this.signupForm().valid()) {
      this.loading.set(true);
      const formData = this.signupModel();

      try {
        // Get the 'bezoeker' role ID
        const allRoles = await this.pocketbase.directClient
          .collection('rollen')
          .getFullList<Rol>();
        const bezoekerRol = allRoles.find((rol: Rol) => rol.rol === 'bezoeker');

        if (!bezoekerRol) {
          throw new Error('Bezoeker rol niet gevonden in de database');
        }

        // Create user account with 'bezoeker' role
        const userData = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
          name: formData.name,
          emailVisibility: true,
          rollen: [bezoekerRol.id],
        };

        await this.pocketbase.client.collection('users').create(userData);

        // Automatically log in after successful signup
        const authData = await this.pocketbase.client
          .collection('users')
          .authWithPassword(formData.email, formData.password, {
            expand: 'groep,rollen',
          });

        if (authData) {
          this.authService.registerUser(
            authData.record as unknown as Gebruiker
          );

          // Only open side drawer if user is not just a 'bezoeker'
          const userRoles =
            (authData.record as unknown as Gebruiker).expand?.rollen?.map(
              (r: Rol) => r.rol
            ) || [];
          const isOnlyBezoeker =
            userRoles.length === 1 && userRoles[0] === 'bezoeker';

          if (!isOnlyBezoeker) {
            this.sideDrawerService.open();
          }

          this.toastr.success('Account succesvol aangemaakt!', 'Welkom', {
            positionClass: 'toast-bottom-right',
          });
          this.router.navigate(['profiel']);
        }
      } catch (error: unknown) {
        // Log full error for debugging
        console.error('Signup error:', error);

        // Use ErrorService for consistent error handling
        const errorMessage = this.errorService.getErrorMessage(
          error,
          'Account aanmaken'
        );

        this.toastr.error(errorMessage, 'Fout bij aanmaken account', {
          positionClass: 'toast-bottom-right',
          timeOut: 7000,
        });
      } finally {
        this.loading.set(false);
      }
    }
  }
}
