import { DatePipe, NgOptimizedImage } from '@angular/common';
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
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { ToastrService } from 'ngx-toastr';
import { BaseModel } from 'pocketbase';
import { Subscription } from 'rxjs';
import confetti from 'canvas-confetti';
import { Environment } from '../../../../environment';
import { Groep } from '../../../models/domain/groep.model';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
  selector: 'app-lid-worden',
  templateUrl: './lid-worden.component.html',
  styleUrl: './lid-worden.component.scss',
  imports: [
    MatProgressSpinnerModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
    NgOptimizedImage
],
  providers: [
    provideNativeDateAdapter(),
    DatePipe,
    { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
  ],
})
export class LidWordenComponent implements OnInit, OnDestroy {
  //info om lid te worden
  recordId = signal('');
  collectionId = signal('');
  content1: WritableSignal<string | null> = signal(null);
  content2: WritableSignal<string | null> = signal(null);
  content3: WritableSignal<string | null> = signal(null);
  img_1 = signal('');
  img_2 = signal('');
  img_3 = signal('');

  //formulier
  voornaam = signal<string | null>(null);
  achternaam = signal<string | null>(null);
  email = signal<string | null>(null);
  message = signal<string | null>(null);
  geboorteDatum = signal<Date | undefined>(undefined);
  selectedGroep = signal<Groep | null>(null);
  groepen: WritableSignal<Groep[]> = signal([]);

  loading = signal(false);
  submitted = signal(false);

  seoService = inject(SeoService);
  client = inject(PocketbaseService);
  clientB = inject(PocketbaseService).client;
  datePipe = inject(DatePipe);
  toastr = inject(ToastrService);
  environment = inject(Environment);
  recaptchaV3Service = inject(ReCaptchaV3Service);
  subscriptions: Subscription[] = [];

  constructor() {
    this.seoService.update(
      'Tovedem - Lid Worden',
      'Word lid van Tovedem! Ontdek hoe je lid kunt worden van onze toneelgroep in De Meern.'
    );
  }

  async ngOnInit(): Promise<void> {
    this.groepen.set(await this.client.getAll<Groep>('groepen'));
    const record = (
      await this.client.getAll('lid_worden')
    )[0] as unknown as BaseModel;

    this.recordId.set(record.id);
    this.collectionId.set(record.collectionId);
    this.img_1.set(record.img_1);
    this.img_2.set(record.img_2);
    this.img_3.set(record.img_3);

    this.content1.set(record.tekst_1);
    this.content2.set(record.tekst_2);
    this.content3.set(record.tekst_3);

    // Update Open Graph tags
    this.seoService.updateOpenGraphTags({
      title: 'Tovedem - Lid Worden',
      description: 'Word lid van Tovedem! Ontdek hoe je lid kunt worden van onze toneelgroep in De Meern.',
      url: 'https://tovedem.nergy.space/lid-worden',
      type: 'website',
      siteName: 'Tovedem',
    });
  }

  getImageUrl(collectionId: string, recordId: string, imageId: string): string {
    return `${this.environment.pocketbase.baseUrl}/api/files/${collectionId}/${recordId}/${imageId}`;
  }

  async submit(): Promise<void> {
    this.loading.set(true);

    this.subscriptions.push(
      this.recaptchaV3Service.execute('lid_worden').subscribe({
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
              await this.clientB.collection('leden').create({
                voornaam: this.voornaam(),
                achternaam: this.achternaam(),
                groep: this.selectedGroep(),
                bericht: this.message(),
                geboorte_datum: this.geboorteDatum(),
                email: this.email(),
              });

              this.toastr.success(
                `Bedankt voor de aanmelding, ${this.voornaam()}.`,
                'Aanvraag verzonden!'
              );

              // Fire confetti!
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });

              // Clear confetti after a certain duration
              // Using setTimeout is fine here as confetti.reset() doesn't need Angular change detection
              setTimeout(() => confetti.reset(), 3000);

              this.voornaam.set(null);
              this.achternaam.set(null);
              this.email.set(null);
              this.message.set(null);
              this.geboorteDatum.set(undefined);
              this.selectedGroep.set(null);
              
              this.submitted.set(true);
              this.loading.set(false);
            } catch (error) {
              console.error(error);
              this.toastr.error(
                'Er is iets misgegaan bij het versturen van het bericht. Probeer het later opnieuw.'
              );
              this.loading.set(false);
            }
          } else {
            this.loading.set(false);
          }
        },
        error: () => {
          this.loading.set(false);
          this.toastr.error(
            'Er is iets misgegaan bij het versturen van het bericht. Probeer het later opnieuw.'
          );
        },
      })
    );
  }

  formIsValid(): boolean {
    return (
      !!this.voornaam() &&
      this.voornaam() != '' &&
      !!this.achternaam() &&
      this.achternaam() != '' &&
      !!this.selectedGroep() &&
      !!this.email() &&
      this.email() != '' &&
      !!this.geboorteDatum() &&
      !!this.selectedGroep() &&
      !!this.message() &&
      this.message() != ''
    );
  }

  resetForm(): void {
    this.submitted.set(false);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
