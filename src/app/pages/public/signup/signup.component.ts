import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Gebruiker } from '../../../models/domain/gebruiker.model';
import { Rol } from '../../../models/domain/rol.model';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';
import { SideDrawerService } from '../../../shared/services/side-drawer.service';

@Component({
  selector: 'app-signup',
  imports: [
    CommonModule,
    MatInputModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    RouterModule,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  username?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  name?: string;

  seoService = inject(SeoService);
  pocketbase = inject(PocketbaseService);
  authService = inject(AuthService);
  router = inject(Router);
  sideDrawerService = inject(SideDrawerService);
  toastr = inject(ToastrService);

  get formIsValid(): boolean {
    return (
      !!this.username &&
      !!this.email &&
      !!this.password &&
      !!this.passwordConfirm &&
      !!this.name &&
      this.password === this.passwordConfirm
    );
  }

  loading = signal(false);

  constructor() {
    this.seoService.update('Tovedem - Account Aanmaken');
  }

  async signup(): Promise<void> {
    if (this.formIsValid) {
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
          username: this.username!,
          email: this.email!,
          password: this.password!,
          passwordConfirm: this.passwordConfirm!,
          name: this.name!,
          emailVisibility: true,
          rollen: [bezoekerRol.id],
        };

        await this.pocketbase.client.collection('users').create(userData);

        // Automatically log in after successful signup
        const authData = await this.pocketbase.client
          .collection('users')
          .authWithPassword(this.email!, this.password!, {
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
      } catch (error: any) {
        console.error('Signup error:', error);
        const errorMessage =
          error?.response?.message ||
          'Er is een fout opgetreden bij het aanmaken van uw account.';
        this.toastr.error(errorMessage, 'Fout', {
          positionClass: 'toast-bottom-right',
        });
      } finally {
        this.loading.set(false);
      }
    }
  }
}
