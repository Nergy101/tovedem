import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../shared/services/auth.service';
import { SideDrawerService } from '../../../shared/services/side-drawer.service';

import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-profiel',
  standalone: true,
  imports: [
    CommonModule,
    MatAccordion,
    MatExpansionModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
  ],
  templateUrl: './profiel.component.html',
  styleUrl: './profiel.component.scss',
})
export class ProfielComponent implements OnInit {
  authService: AuthService = inject(AuthService);
  router: Router = inject(Router);
  sideDrawerService = inject(SideDrawerService);

  user = this.authService.userData;

  titleService = inject(Title);

  constructor() {
    this.titleService.setTitle(
      `Tovedem - Profiel - ${this.authService.userData().username} `
    );
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  toggle() {
    this.sideDrawerService.toggle();
  }

  logout(): void {
    this.authService.unregisterUser();
    this.router.navigate(['/login']);
  }
}
