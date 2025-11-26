import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Gebruiker } from '../../../models/domain/gebruiker.model';
import { Rol } from '../../../models/domain/rol.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';
import { SideDrawerService } from '../../../shared/services/side-drawer.service';
import { ErrorService } from '../../../shared/services/error.service';

@Component({
  selector: 'app-signup',
  imports: [
    CommonModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    RouterModule,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  // Form field signals
  username = signal('');
  email = signal('');
  name = signal('');
  password = signal('');
  passwordConfirm = signal('');
  hidePassword = signal(true);
  hidePasswordConfirm = signal(true);

  seoService = inject(SeoService);
  pocketbase = inject(PocketbaseService);
  authService = inject(AuthService);
  errorService = inject(ErrorService);
  router = inject(Router);
  sideDrawerService = inject(SideDrawerService);
  toastr = inject(ToastrService);

  // Validation computed signals
  usernameValid = computed(() => {
    const usernameValue = this.username();
    if (!usernameValue || usernameValue.trim().length === 0) return false;
    const usernamePattern = /^[a-zA-Z0-9_-]+$/;
    return usernamePattern.test(usernameValue);
  });

  emailValid = computed(() => {
    const emailValue = this.email();
    if (!emailValue || emailValue.trim().length === 0) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  });

  nameValid = computed(() => {
    const nameValue = this.name();
    return !!nameValue && nameValue.trim().length > 0;
  });

  passwordValid = computed(() => {
    const passwordValue = this.password();
    if (!passwordValue) return false;
    return passwordValue.length >= 8;
  });

  passwordsMatch = computed(() => {
    const passwordValue = this.password();
    const passwordConfirmValue = this.passwordConfirm();
    // Only return true if both fields are filled AND they match
    if (!passwordValue || !passwordConfirmValue) {
      return false; // Don't show success if fields are empty
    }
    return passwordValue === passwordConfirmValue;
  });

  passwordsDoNotMatch = computed(() => {
    const passwordValue = this.password();
    const passwordConfirmValue = this.passwordConfirm();
    // Show error if both fields are filled and they don't match
    return (
      passwordValue.length > 0 &&
      passwordConfirmValue.length > 0 &&
      passwordValue !== passwordConfirmValue
    );
  });

  formIsValid = computed(() => {
    const passwordValue = this.password();
    const passwordConfirmValue = this.passwordConfirm();

    return (
      this.usernameValid() &&
      this.emailValid() &&
      this.nameValid() &&
      this.passwordValid() &&
      passwordConfirmValue.length > 0 &&
      passwordValue === passwordConfirmValue
    );
  });

  loading = signal(false);

  constructor() {
    this.seoService.update('Tovedem - Account Aanmaken');
  }

  async signup(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    console.log('Signup method called');
    console.log('Form valid:', this.formIsValid());
    console.log('Form values:', {
      username: this.username(),
      email: this.email(),
      name: this.name(),
      password: this.password().length > 0 ? '***' : '',
      passwordConfirm: this.passwordConfirm().length > 0 ? '***' : '',
    });

    if (this.formIsValid()) {
      this.loading.set(true);

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
          username: this.username(),
          email: this.email(),
          password: this.password(),
          passwordConfirm: this.passwordConfirm(),
          name: this.name(),
          emailVisibility: true,
          rollen: [bezoekerRol.id],
        };

        await this.pocketbase.client.collection('users').create(userData);

        // Automatically log in after successful signup
        const authData = await this.pocketbase.client
          .collection('users')
          .authWithPassword(this.email(), this.password(), {
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
