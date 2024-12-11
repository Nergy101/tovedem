import { Component, inject } from '@angular/core';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
    selector: 'app-privacy-pagina',
    imports: [],
    templateUrl: './privacy-beleid.component.html',
    styleUrl: './privacy-beleid.component.scss'
})
export class PrivacyBeleidComponent {

  seoService = inject(SeoService);

  constructor() {
    this.seoService.update('Tovedem - Privacy Beleid');
  }
}
