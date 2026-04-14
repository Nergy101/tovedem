import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { BreakpointService } from '../../shared/services/breakpoint.service';
import { PocketbaseService } from '../../shared/services/pocketbase.service';
import { SideDrawerService } from '../../shared/services/side-drawer.service';
@Component({
  selector: 'app-sidenav',
  imports: [
    RouterModule,
    MatButtonModule,
    MatSidenavModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatListModule,
    MatExpansionModule,
    MatBadgeModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent implements OnInit {
  sideDrawerService = inject(SideDrawerService);
  authService = inject(AuthService);
  breakpointService = inject(BreakpointService);
  client = inject(PocketbaseService);
  private router = inject(Router);

  private readonly STORAGE_KEY = 'sidenav-panel-state';

  panelState: Record<string, boolean> = {
    'productie-info': true,
    'commissies': true,
    'beheer': true,
    'galerij': true,
    'developers': true,
  };

  ngOnInit(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.panelState = { ...this.panelState, ...JSON.parse(saved) };
      } catch {}
    }
  }

  setPanelState(key: string, expanded: boolean): void {
    this.panelState[key] = expanded;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.panelState));
  }

  isSectionActive(routes: string[]): boolean {
    return routes.some((route) => this.router.url.startsWith(route));
  }

  close(): void {
    this.sideDrawerService.close();
  }

  navigate(url: string): void {
    window.open(url, '_blank');
  }
}
