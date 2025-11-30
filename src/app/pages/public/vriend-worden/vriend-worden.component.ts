import {
  Component,
  OnDestroy,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { Field, form, required, email, debounce } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { ToastrService } from 'ngx-toastr';
import { Environment } from '../../../../environment';
import { VriendWordenFormModel } from '../../../models/form-models/vriend-worden-form.model';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-vriend-worden',
  imports: [
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatIconModule,
    RouterModule,
    MatInputModule,
    Field,
    MatDatepickerModule,
    MatButtonModule,
    RouterModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './vriend-worden.component.html',
  styleUrl: './vriend-worden.component.scss',
})
export class VriendWordenComponent implements OnInit, OnDestroy {
  content: WritableSignal<string | null> = signal(null);

  // Signal Forms: Create form model and form instance
  // NOTE: Signal Forms are experimental in Angular 21
  vriendWordenModel = signal<VriendWordenFormModel>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  vriendWordenForm = form(this.vriendWordenModel, (schemaPath) => {
    debounce(schemaPath.name, 500);
    debounce(schemaPath.email, 500);
    debounce(schemaPath.subject, 500);
    debounce(schemaPath.message, 500);
    required(schemaPath.name, { message: 'Naam is verplicht' });
    required(schemaPath.email, { message: 'E-mail is verplicht' });
    email(schemaPath.email, { message: 'Ongeldig e-mailadres' });
    required(schemaPath.subject, { message: 'Onderwerp is verplicht' });
    required(schemaPath.message, { message: 'Bericht is verplicht' });
  });

  submitted = signal(false);

  toastr = inject(ToastrService);
  pocketbaseService = inject(PocketbaseService);
  client = this.pocketbaseService.client; // Keep for create operations
  router = inject(Router);
  recaptchaV3Service = inject(ReCaptchaV3Service);
  environment = inject(Environment);

  subscriptions: Subscription[] = [];

  verstuurVriendVanTovedemMail(): void {
    if (!this.vriendWordenForm().valid()) {
      return;
    }

    this.subscriptions.push(
      this.recaptchaV3Service.execute('vriend_worden').subscribe({
        next: async (token) => {
          const response = await fetch(
            `${this.environment.pocketbase.baseUrl}/recaptcha`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token,
              }),
            }
          );

          const resultObj = await response.json();

          if (resultObj.result.success) {
            try {
              const formData = this.vriendWordenModel();
              await this.client.collection('vriend_worden_verzoeken').create({
                name: formData.name,
                email: formData.email,
                subject: formData.subject,
                message: formData.message,
              });

              this.toastr.success(
                'Uw bericht is verstuurd. Wij nemen zo snel mogelijk contact met u op.'
              );

              // Reset form
              this.vriendWordenModel.set({
                name: '',
                email: '',
                subject: '',
                message: '',
              });

              this.submitted.set(true);
            } catch (error) {
              console.error(error);
              this.toastr.error(
                'Er is iets misgegaan bij het versturen van het bericht. Probeer het later opnieuw.'
              );
            }
          }
        },
      })
    );
  }

  seoService = inject(SeoService);
  constructor() {
    this.seoService.update('Tovedem - Vriend van Tovedem worden');
  }

  async ngOnInit(): Promise<void> {
    // Use cached service method instead of direct client access
    const page = await this.pocketbaseService.getPage<any>(
      'vriend_worden',
      1,
      1
    );
    const { tekst_1 } = page.items[0];
    this.content.set(tekst_1);
  }

  resetForm(): void {
    this.submitted.set(false);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
