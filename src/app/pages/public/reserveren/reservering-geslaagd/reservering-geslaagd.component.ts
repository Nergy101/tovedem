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
  toast = signal<{
    message: string;
    icon: string;
    kind: 'success' | 'error' | 'warning';
  } | null>(null);
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

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
    this.showStoredSuccessToast();

    this.scrollToTop();
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  celebrate(): void {
    confetti({
      particleCount: 200,
      spread: 300,
      origin: { y: 0.1 },
    });

    // Clear confetti after a certain duration
    // Using setTimeout is fine here as confetti.reset() doesn't need Angular change detection
    setTimeout(() => confetti.reset(), 3000);
  }

  dismissToast(): void {
    this.toast.set(null);
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
  }

  private showStoredSuccessToast(): void {
    const storedToast = sessionStorage.getItem('reservation-success-toast');
    if (!storedToast) {
      return;
    }

    sessionStorage.removeItem('reservation-success-toast');

    try {
      const parsedToast = JSON.parse(storedToast) as {
        message: string;
        icon: string;
        kind: 'success' | 'error' | 'warning';
      };

      this.toast.set(parsedToast);
      this.toastTimeout = setTimeout(() => {
        this.toast.set(null);
        this.toastTimeout = null;
      }, 5000);
    } catch {
      sessionStorage.removeItem('reservation-success-toast');
    }
  }
}
