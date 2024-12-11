import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { ToastrService } from 'ngx-toastr';
import { Environment } from '../../../../environment';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
    selector: 'app-vriend-worden',
    imports: [MatProgressSpinnerModule,
        MatFormFieldModule,
        MatIconModule,
        CommonModule,
        RouterModule,
        MatInputModule,
        FormsModule,
        MatDatepickerModule,
        MatButtonModule,
        RouterModule,
        MatCardModule,
        MatCheckboxModule,
        MatDividerModule,
    ],
    templateUrl: './vriend-worden.component.html',
    styleUrl: './vriend-worden.component.scss'
})

export class VriendWordenComponent implements OnInit, OnDestroy {

  content: WritableSignal<string | null> = signal(null);
  name: string | null = null;
  email: string | null = null;
  subject: string | null = null;
  message: string | null = null;

  toastr = inject(ToastrService);
  client = inject(PocketbaseService).client;
  router = inject(Router);
  recaptchaV3Service = inject(ReCaptchaV3Service);
  environment = inject(Environment);

  subscriptions: any[] = [];

  verstuurVriendVanTovedemMail() {
    this.subscriptions.push(this.recaptchaV3Service.execute('vriend_worden')
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
                await this.client.collection('vriend_worden_verzoeken').create({
                  name: this.name,
                  email: this.email,
                  subject: this.subject,
                  message: this.message
                });

                this.toastr.success('Uw bericht is verstuurd. Wij nemen zo snel mogelijk contact met u op.');

                this.name = null;
                this.email = null;
                this.subject = null;
                this.message = null;
              } catch (error) {
                console.error(error);
                this.toastr.error('Er is iets misgegaan bij het versturen van het bericht. Probeer het later opnieuw.');
              }
            }
          }
        }));
  }

  seoService = inject(SeoService);
  constructor() {
    this.seoService.update('Tovedem - Vriend van Tovedem worden');
  }

  async ngOnInit(): Promise<void> {
    const record = (await this.client.collection('vriend_worden').getList(1, 1))
      .items[0];
    this.content.set((record as any).tekst_1);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}

