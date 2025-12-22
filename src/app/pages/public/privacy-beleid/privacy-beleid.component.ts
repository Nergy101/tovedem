import { Component, inject } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
    selector: 'app-privacy-pagina',
    imports: [MatDividerModule, MatIconModule],
    templateUrl: './privacy-beleid.component.html',
    styleUrl: './privacy-beleid.component.scss'
})
export class PrivacyBeleidComponent {

  seoService = inject(SeoService);

  constructor() {
    this.seoService.update('Tovedem - Privacy Beleid');
  }
}
