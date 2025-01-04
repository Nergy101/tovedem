import { CommonModule, DatePipe, NgOptimizedImage } from '@angular/common';
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
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatSelect,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
    NgOptimizedImage,
  ],
  providers: [
    provideNativeDateAdapter(),
    DatePipe,
    { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
  ],
})
export class LidWordenComponent implements OnInit, OnDestroy {
  //info om lid te worden
  recordId = '';
  collectionId = '';
  content1: WritableSignal<string | null> = signal(null);
  content2: WritableSignal<string | null> = signal(null);
  content3: WritableSignal<string | null> = signal(null);
  img_1 = '';
  img_2 = '';
  img_3 = '';

  //formulier
  voornaam: string | null = null;
  achternaam: string | null = null;
  email: string | null = null;
  message: string | null = null;
  geboorteDatum?: Date;
  selectedGroep: Groep | null = null;
  groepen: WritableSignal<Groep[]> = signal([]);

  loading = signal(false);

  seoService = inject(SeoService);
  client = inject(PocketbaseService);
  clientB = inject(PocketbaseService).client;
  datePipe = inject(DatePipe);
  toastr = inject(ToastrService);
  environment = inject(Environment);
  recaptchaV3Service = inject(ReCaptchaV3Service);
  subscriptions: Subscription[] = [];

  constructor() {
    this.seoService.update('Tovedem - Lid Worden');
  }

  async ngOnInit(): Promise<void> {
    this.groepen.set(await this.client.getAll<Groep>('groepen'));
    const record = (
      await this.client.getAll('lid_worden')
    )[0] as unknown as BaseModel;

    this.recordId = record.id;
    this.collectionId = record.collectionId;
    this.img_1 = record.img_1;
    this.img_2 = record.img_2;
    this.img_3 = record.img_3;

    this.content1.set(record.tekst_1);
    this.content2.set(record.tekst_2);
    this.content3.set(record.tekst_3);
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
                voornaam: this.voornaam,
                achternaam: this.achternaam,
                groep: this.selectedGroep,
                bericht: this.message,
                geboorte_datum: this.geboorteDatum,
                email: this.email,
              });

              this.toastr.success(
                `Bedankt voor de aanmelding, ${this.voornaam}.`,
                'Aanvraag verzonden!'
              );

              this.voornaam = null;
              this.achternaam = null;
              this.email = null;
              this.message = null;
              this.geboorteDatum = undefined;
              this.selectedGroep = null;
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

    this.loading.set(false);
  }

  formIsValid(): boolean {
    return (
      !!this.voornaam &&
      this.voornaam != '' &&
      !!this.achternaam &&
      this.achternaam != '' &&
      !!this.selectedGroep &&
      !!this.email &&
      this.email != '' &&
      !!this.geboorteDatum &&
      !!this.selectedGroep &&
      !!this.message &&
      this.message != ''
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
