import { Component, inject, signal } from '@angular/core';
import {
  FormField,
  form,
  required,
  minLength,
  debounce,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { WachtwoordResetFormModel } from '../../../models/form-models/wachtwoord-reset-form.model';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
  selector: 'app-wachtwoord-reset',
  imports: [
    MatInputModule,
    FormField,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    RouterModule,
  ],
  templateUrl: './wachtwoord-reset.component.html',
  styleUrl: './wachtwoord-reset.component.scss',
})
export class WachtwoordResetComponent {
  // Signal Forms: Create form model and form instance
  // NOTE: Signal Forms are experimental in Angular 21
  resetModel = signal<WachtwoordResetFormModel>({
    password: '',
    passwordConfirm: '',
  });

  resetForm = form(this.resetModel, (schemaPath) => {
    debounce(schemaPath.password, 500);
    debounce(schemaPath.passwordConfirm, 500);
    required(schemaPath.password, { message: 'Wachtwoord is verplicht' });
    minLength(schemaPath.password, 8, {
      message: 'Wachtwoord moet minimaal 8 tekens lang zijn',
    });
    required(schemaPath.passwordConfirm, {
      message: 'Bevestig je wachtwoord',
    });
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
      return undefined;
    });
  });

  hidePassword = signal(true);
  hidePasswordConfirm = signal(true);
  loading = signal(false);
  resetError = signal<string | null>(null);
  tokenMissing = signal(false);

  private token: string | null;

  seoService = inject(SeoService);
  pocketbase = inject(PocketbaseService);
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastr = inject(ToastrService);

  constructor() {
    this.seoService.update('Tovedem - Wachtwoord resetten');
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.tokenMissing.set(true);
    }
  }

  async resetWachtwoord(): Promise<void> {
    if (!this.token) {
      this.tokenMissing.set(true);
      return;
    }
    if (this.resetForm().valid()) {
      this.loading.set(true);
      this.resetError.set(null);
      const { password, passwordConfirm } = this.resetModel();

      try {
        // Try the users collection first, then _superusers (admin accounts)
        const confirmed =
          (await this.pocketbase.client
            .collection('users')
            .confirmPasswordReset(this.token, password, passwordConfirm)
            .catch(() => false)) ||
          (await this.pocketbase.client
            .collection('_superusers')
            .confirmPasswordReset(this.token, password, passwordConfirm)
            .catch(() => false));

        if (confirmed) {
          this.toastr.success(
            'Je wachtwoord is gewijzigd. Je kunt nu inloggen.'
          );
          this.router.navigate(['/login']);
        } else {
          this.resetError.set(
            'Deze reset-link is ongeldig of verlopen. Vraag een nieuwe link aan.'
          );
        }
      } catch {
        this.resetError.set(
          'Er is iets misgegaan. Probeer het later opnieuw.'
        );
      } finally {
        this.loading.set(false);
      }
    }
  }
}
