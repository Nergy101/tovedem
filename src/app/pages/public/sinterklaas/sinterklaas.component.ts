import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { Title } from '@angular/platform-browser';
import { MatDividerModule } from '@angular/material/divider';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';

@Component({
  selector: 'app-sinterklaas',
  standalone: true,
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
    MdbCarouselModule,
  ],
  templateUrl: './sinterklaas.component.html',
  styleUrl: './sinterklaas.component.scss',
})
export class SinterklaasComponent implements OnInit {
  client = inject(PocketbaseService).client;

  content: WritableSignal<string | null> = signal(null);

  titleService = inject(Title);
  name: string | null = null;
  email: string | null = null;
  subject: string | null = null;
  message: string | null = null;
  router = inject(Router);
  img_src: WritableSignal<any[] | null> = signal(null);
  images: any[] = [];


  verstuurSinterklaasMail() {}

  constructor() {
    this.titleService.setTitle('Tovedem - Sinterklaas');
  }

  getImageUrl(collectionId: string, recordId: string, imageId: string): string {
    return `https://pocketbase.nergy.space/api/files/${collectionId}/${recordId}/${imageId}`;
  }

  async ngOnInit(): Promise<void> {
    const record = (await this.client.collection('sinterklaas').getList(1, 1))
      .items[0];
      

    this.content.set((record as any).tekst_1);
    for(const img of record.afbeeldingen){
      this.images.push(this.getImageUrl(record.collectionId, record.id, img));
    }
    console.log(this.images)
    

  }


}
