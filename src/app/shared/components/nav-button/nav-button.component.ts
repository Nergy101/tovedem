import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav-button',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './nav-button.component.html',
  styleUrl: './nav-button.component.scss',
})
export class NavButtonComponent {
  queryParams = input<any>({});
  navigationParts = input.required<any[]>();

  router = inject(Router);

  navigate(): void {
    this.router.navigate(this.navigationParts(), {
      queryParams: this.queryParams(),
    });
  }
}
