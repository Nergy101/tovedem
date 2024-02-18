import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PocketbaseService } from '../services/pocketbase.service';

@Component({
  selector: 'app-lid-worden',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './lid-worden.component.html',
  styleUrl: './lid-worden.component.scss',
})
export class LidWordenComponent implements OnInit {
  client = inject(PocketbaseService).client;

  content1: WritableSignal<string | null> = signal(null);
  content2: WritableSignal<string | null> = signal(null);
  content3: WritableSignal<string | null> = signal(null);

  async ngOnInit(): Promise<void> {
    const record = (await this.client.collection('lid_worden').getList(1, 1))
      .items[0];

    this.content1.set((record as any).tekst_1);
    this.content2.set((record as any).tekst_2);
    this.content3.set((record as any).tekst_3);
  }
}
