import { Component, inject, signal } from '@angular/core';
import { FormField, form, required, email, debounce } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { WachtwoordVergetenFormModel } from '../../../models/form-models/wachtwoord-vergeten-form.model';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
  selector: 'app-wachtwoord-vergeten',
  imports: [
    MatInputModule,
    FormField,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    RouterModule,
  ],
  templateUrl: './wachtwoord-vergeten.component.html',
  styleUrl: './wachtwoord-vergeten.component.scss',
})
export class WachtwoordVergetenComponent {
  // Signal Forms: Create form model and form instance
  // NOTE: Signal Forms are experimental in Angular 21
  wachtwoordVergetenModel = signal<WachtwoordVergetenFormModel>({
    email: '',
  });

  wachtwoordVergetenForm = form(this.wachtwoordVergetenModel, (schemaPath) => {
    debounce(schemaPath.email, 500);
    required(schemaPath.email, { message: 'E-mail is verplicht' });
    email(schemaPath.email, { message: 'Vul een geldig e-mailadres in' });
  });

  seoService = inject(SeoService);
  pocketbase = inject(PocketbaseService);

  loading = signal(false);
  // Always show the same generic message: don't reveal whether the email exists
  emailVerzonden = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.seoService.update('Tovedem - Wachtwoord vergeten');
  }

  async verstuurResetMail(): Promise<void> {
    if (this.wachtwoordVergetenForm().valid()) {
      this.loading.set(true);
      this.errorMessage.set(null);
      const email = this.wachtwoordVergetenModel().email;

      try {
        // Request a reset on both auth collections so superusers are covered too.
        // PocketBase returns success even for unknown emails; ignore individual
        // failures so we never leak whether an account exists.
        await Promise.allSettled([
          this.pocketbase.client
            .collection('users')
            .requestPasswordReset(email),
          this.pocketbase.client
            .collection('_superusers')
            .requestPasswordReset(email),
        ]);

        this.emailVerzonden.set(true);
      } catch {
        this.errorMessage.set(
          'Er is iets misgegaan bij het versturen van de e-mail. Probeer het later opnieuw.'
        );
      } finally {
        this.loading.set(false);
      }
    }
  }
}
