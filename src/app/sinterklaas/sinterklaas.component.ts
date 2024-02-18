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
  selector: 'app-sinterklaas',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './sinterklaas.component.html',
  styleUrl: './sinterklaas.component.scss',
})
export class SinterklaasComponent implements OnInit {
  client = inject(PocketbaseService).client;

  content: WritableSignal<string | null> = signal(null);

  async ngOnInit(): Promise<void> {
    const record = (await this.client.collection('sinterklaas').getList(1, 1))
      .items[0];
    this.content.set((record as any).tekst_1);
  }
}
