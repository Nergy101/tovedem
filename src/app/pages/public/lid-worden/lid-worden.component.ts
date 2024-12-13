import {
  Component,
  OnDestroy,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Title } from '@angular/platform-browser';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { DatePipe, Time } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Groep } from '../../../models/domain/groep.model';
import { ToastrService } from 'ngx-toastr';
import { Environment } from '../../../../environment';
import { ReCaptchaV3Service } from 'ng-recaptcha';
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
    ],
    providers: [
        provideNativeDateAdapter(),
        DatePipe,
        { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
    ]
})
export class LidWordenComponent implements OnInit, OnDestroy {
  //info om lid te worden
  recordId: string = '';
  collectionId: string = '';
  content1: WritableSignal<string | null> = signal(null);
  content2: WritableSignal<string | null> = signal(null);
  content3: WritableSignal<string | null> = signal(null);
  img_1: string = '';
  img_2: string = '';
  img_3: string = '';

  //formulier
  voornaam: string | null = null;
  achternaam: string | null = null;
  email: string | null = null;
  message: string | null = null;
  geboorteDatum?: Date;
  selectedGroep?: any;
  groepen: WritableSignal<any[]> = signal([]);

  loading = signal(false);

  seoService = inject(SeoService);
  client = inject(PocketbaseService);
  clientB= inject(PocketbaseService).client;
  datePipe = inject(DatePipe);
  toastr = inject(ToastrService);
  environment = inject(Environment);
  recaptchaV3Service = inject(ReCaptchaV3Service);
  subscriptions: any[] = [];

  constructor() {
    this.seoService.update('Tovedem - Lid Worden');
  }

  async ngOnInit(): Promise<void> {
    this.groepen.set(await this.client.getAll<Groep>('groepen'));
    const record = (await this.client.getPage<any>('lid_worden', 1, 1))
      .items[0];

    this.recordId = record.id;
    this.collectionId = record.collectionId;
    this.img_1 = record.img_1;
    this.img_2 = record.img_2;
    this.img_3 = record.img_3;

    this.content1.set((record as any).tekst_1);
    this.content2.set((record as any).tekst_2);
    this.content3.set((record as any).tekst_3);
  }

  getImageUrl(collectionId: string, recordId: string, imageId: string): string {
    return `${this.environment.pocketbase.baseUrl}/api/files/${collectionId}/${recordId}/${imageId}`;
  }

  async submit(): Promise<void> {
    this.loading.set(true);


    this.subscriptions.push(this.recaptchaV3Service.execute('lid_worden')
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
                console.log("deel a")
                await this.clientB.collection('lid_aanmeldingen').create({
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
                this.toastr.error('Er is iets misgegaan bij het versturen van het bericht. Probeer het later opnieuw.');
              }
            }
          }
        }));

    this.loading.set(false);
  }

  formIsValid() {
    return (
      !!this.voornaam &&
      this.voornaam != '' &&
      !!this.achternaam &&
      this.achternaam != '' &&
      !!this.selectedGroep &&
      this.selectedGroep != '' &&
      !!this.email &&
      this.email != ''
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
