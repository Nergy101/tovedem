import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Title } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { lastValueFrom, Subscription } from 'rxjs';
import { Environment } from '../../../../environment';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { ToastrService } from 'ngx-toastr';



@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
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
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnDestroy {

  name: string | null = null;
  email: string | null = null;
  subject: string | null = null;
  message: string | null = null;

  router = inject(Router);
  recaptchaV3Service = inject(ReCaptchaV3Service);
  environment = inject(Environment);
  pocketService = inject(PocketbaseService);
  toastr = inject(ToastrService);

  subscriptions: Subscription[] = [];

  verstuurContactMail() {

    this.recaptchaV3Service.execute('contact')
      .subscribe(
        {
          next: async (token) => {
            const response = await fetch("https://pocketbase.nergy.space/recaptcha", {
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
              this.toastr.success('Contact formulier opgestuurd', 'Succes');
            }

          },
          error: (error) => {
            console.error('Error executing captcha', error);
          }
        });
  }

  titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('Tovedem - Contact');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
