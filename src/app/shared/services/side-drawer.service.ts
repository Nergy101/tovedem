import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SideDrawerService {
  isOpen = signal(true);
  /** Tijdens een rondleiding door de sidebar worden alle secties uitgeklapt. */
  rondleidingActief = signal(false);

  constructor() {
    const sideDrawerOpen = localStorage.getItem('sideDrawerOpen');
    this.isOpen.set(sideDrawerOpen === 'true');
  }

  open(): void {
    this.isOpen.set(true);
    localStorage.setItem('sideDrawerOpen', 'true');
  }

  close(): void {
    this.isOpen.set(false);
    localStorage.setItem('sideDrawerOpen', 'false');
  }
}
