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
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { ToastrService } from 'ngx-toastr';
import { Environment } from '../../../../environment';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sinterklaas',
  imports: [
    MatProgressSpinnerModule,
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
    MdbCarouselModule,
    MatTooltipModule,
  ],
  templateUrl: './sinterklaas.component.html',
  styleUrl: './sinterklaas.component.scss',
})
export class SinterklaasComponent implements OnInit, OnDestroy {
  content: WritableSignal<string | null> = signal(null);
  img_src: WritableSignal<
    { id: number; title: string; description: string; src: string }[] | null
  > = signal(null);

  name: string | null = null;
  email: string | null = null;
  subject: string | null = null;
  message: string | null = null;
  images: { id: number; title: string; description: string; src: string }[] =
    [];
  status: string | null = null;

  toastr = inject(ToastrService);
  router = inject(Router);
  pocketbaseService = inject(PocketbaseService);
  client = this.pocketbaseService.client; // Keep for create operations
  environment = inject(Environment);
  recaptchaV3Service = inject(ReCaptchaV3Service);
  subscriptions: Subscription[] = [];

  verstuurSinterklaasMail(): void {
    this.subscriptions.push(
      this.recaptchaV3Service.execute('sinterklaas').subscribe({
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
              await this.client.collection('sinterklaas_verzoeken').create({
                name: this.name,
                email: this.email,
                subject: this.subject,
                message: this.message,
                status: 'nieuw',
              });

              this.toastr.success(
                'Uw bericht is verstuurd. Wij nemen zo snel mogelijk contact met u op.'
              );

              this.name = null;
              this.email = null;
              this.subject = null;
              this.message = null;
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
    this.seoService.update('Tovedem - Sinterklaas');
  }

  getImageUrl(collectionId: string, recordId: string, imageId: string): string {
    return `https://pocketbase.nergy.space/api/files/${collectionId}/${recordId}/${imageId}`;
  }

  async ngOnInit(): Promise<void> {
    // Use cached service method instead of direct client access
    const page = await this.pocketbaseService.getPage<any>('sinterklaas', 1, 1);
    const record = page.items[0];

    this.content.set(record.tekst_1);

    this.images = record.afbeeldingen.map((img: string) => ({
      id: img,
      src: this.getImageUrl(record.collectionId, record.id, img),
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
