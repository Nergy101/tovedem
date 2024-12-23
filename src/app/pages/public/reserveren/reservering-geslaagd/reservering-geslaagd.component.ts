import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  WritableSignal,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import confetti from 'canvas-confetti';
import { NavButtonComponent } from '../../../../shared/components/nav-button/nav-button.component';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';

@Component({
  selector: 'app-reservering-geslaagd',
  templateUrl: './reservering-geslaagd.component.html',
  styleUrl: './reservering-geslaagd.component.scss',
  imports: [
    MatProgressSpinnerModule,
    MatButtonModule,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    NavButtonComponent,
  ],
})
export class ReserveringGeslaagdComponent implements OnInit {
  url = 'https://pocketbase.nergy.space/';
  client = inject(PocketbaseService).client;
  router = inject(Router);

  content: WritableSignal<string | null> = signal(null);

  @Input({ required: true })
  voorstellingId!: string;

  @Input({ required: true })
  reserveringsId!: string;

  constructor() {
    effect(() => {
      if (this.content()) {
        this.celebrate();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const record = (await this.client.collection('sinterklaas').getList(1, 1))
      .items[0];
    this.content.set(record.tekst_1);
  }

  celebrate(): void {
    confetti({
      particleCount: 200,
      spread: 300,
      origin: { y: 0.1 },
    });

    // Clear confetti after a certain duration
    setTimeout(() => confetti.reset(), 3000);
  }
}
