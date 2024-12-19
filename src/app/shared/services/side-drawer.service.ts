import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SideDrawerService {
  isOpen = signal(true);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }
}
