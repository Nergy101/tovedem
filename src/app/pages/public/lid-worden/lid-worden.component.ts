import {
  Component,
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
import { provideNativeDateAdapter } from '@angular/material/core';
import { DatePipe, Time } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import Groep from '../../../models/domain/groep.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-lid-worden',
  standalone: true,
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
  providers: [provideNativeDateAdapter(), DatePipe],
})
export class LidWordenComponent implements OnInit {
  client = inject(PocketbaseService);
  datePipe = inject(DatePipe);
  toastr = inject(ToastrService);

  //dialogRef = inject(MatDialogRef<LidWordenComponent>);

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

  titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('Tovedem - Lid Worden');
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
    return `https://tovedem.pockethost.io/api/files/${collectionId}/${recordId}/${imageId}`;
  }

  async submit(): Promise<void> {
    this.loading.set(true);

    let aanmelding = {
      reden: 'lid_worden',
      voornaam: this.voornaam,
      achternaam: this.achternaam,
      groep: this.selectedGroep,
      bericht: this.message,
      geboorte_datum: this.geboorteDatum,
      email: this.email,
    } as any;

    await this.client.create('lid_aanmeldingen', aanmelding);

    this.toastr.success(
      `Bedankt voor de aanmelding, ${this.voornaam}.`,
      'Aanvraag verzonden!'
    );
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
}
