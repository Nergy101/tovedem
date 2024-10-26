import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    MatListModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {

  router = inject(Router);

  async navigateTo(routeParts: string[]) {
    await this.router.navigate(routeParts);
    location.reload()
  }

  navigateToFaceBook() {
    window.open('https://www.facebook.com/tovedem', '_blank');
  }

  navigateToInstagram() {
    window.open('https://www.instagram.com/tovedem.demeern/', '_blank');
  }
}
