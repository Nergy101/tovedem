import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-vriend-worden',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './vriend-worden.component.html',
  styleUrl: './vriend-worden.component.scss',
})
export class VriendWordenComponent implements OnInit {
  client = inject(PocketbaseService).client;

  content: WritableSignal<string | null> = signal(null);

  titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('Tovedem - Steunen');
  }

  async ngOnInit(): Promise<void> {
    const record = (await this.client.collection('vriend_worden').getList(1, 1))
      .items[0];
    this.content.set((record as any).tekst_1);
  }
}
