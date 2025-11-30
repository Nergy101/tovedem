
import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Environment } from '../../../../environment';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';



@Component({
    selector: 'app-contact',
    imports: [
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatDividerModule
],
    providers: [{ provide: MAT_DATE_LOCALE, useValue: 'nl-NL' }],
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnDestroy {
  name: string | null = null;
  email: string | null = null;
  subject: string | null = null;
  message: string | null = null;
  submitted = signal(false);

  router = inject(Router);
  recaptchaV3Service = inject(ReCaptchaV3Service);
  environment = inject(Environment);
  pocketService = inject(PocketbaseService);
  toastr = inject(ToastrService);

  seoService = inject(SeoService);
  subscriptions: Subscription[] = [];

  constructor() {
    this.seoService.update(
      'Tovedem - Contact',
      'Neem contact op met Tovedem. Wij zijn gevestigd in De Schalm, Orangjelaan 10, 3454 BT De Meern.'
    );

    // Add LocalBusiness structured data
    this.seoService.updateStructuredDataForLocalBusiness({
      name: 'Tovedem',
      address: {
        streetAddress: 'Orangjelaan 10',
        addressLocality: 'De Meern',
        postalCode: '3454 BT',
        addressCountry: 'NL',
      },
      url: 'https://tovedem.nergy.space',
    });

    // Update Open Graph tags
    this.seoService.updateOpenGraphTags({
      title: 'Tovedem - Contact',
      description: 'Neem contact op met Tovedem. Wij zijn gevestigd in De Schalm, Orangjelaan 10, 3454 BT De Meern.',
      url: 'https://tovedem.nergy.space/contact',
      type: 'website',
      siteName: 'Tovedem',
    });
  }

  verstuurContactMail(): void {
    this.subscriptions.push(this.recaptchaV3Service.execute('contact')
      .subscribe(
        {
          next: async (token) => {
            const response = await fetch(`${this.environment.pocketbase.baseUrl}/recaptcha`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                token
              })
            });

            const resultObj = await response.json();

            if (resultObj.result.success) {
              try {
                await this.pocketService.create('contact_verzoeken', {
                  name: this.name,
                  email: this.email,
                  subject: this.subject,
                  message: this.message,
                })

                this.toastr.success('Uw bericht is verstuurd. Wij nemen zo snel mogelijk contact met u op.');

                this.name = null;
                this.email = null;
                this.subject = null;
                this.message = null;
                
                this.submitted.set(true);
              }
              catch (error) {
                console.error('Error sending contact form', error);
                this.toastr.error('Er is iets misgegaan bij het versturen van het bericht. Probeer het later opnieuw.');
              }
            } else {
              console.error('Captcha failed');
            }

          },
          error: (error) => {
            console.error('Error executing captcha', error);
          }
        }));
  }

  resetForm(): void {
    this.submitted.set(false);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
