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


@Component({
  selector: 'app-vriend-worden',
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
  ],
  templateUrl: './vriend-worden.component.html',
  styleUrl: './vriend-worden.component.scss',
})

export class VriendWordenComponent implements OnInit {
  client = inject(PocketbaseService).client;

  content: WritableSignal<string | null> = signal(null);

  titleService = inject(Title);
  name: string | null = null;
  email: string | null = null;
  subject: string | null = null;
  message: string | null = null;
  router = inject(Router);
  verstuurVriendVanTovedemMail() {}

  constructor() {
    this.titleService.setTitle('Tovedem - Vriend van Tovedem worden!!');
  }

  async ngOnInit(): Promise<void> {
    const record = (await this.client.collection('vriend_worden').getList(1, 1))
      .items[0];
    this.content.set((record as any).tekst_1);
  }
}

