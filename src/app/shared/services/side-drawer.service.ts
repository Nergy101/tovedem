import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SideDrawerService {
  isOpen = signal(false);

  constructor() {}

  open() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  toggle() {
    this.isOpen.set(!this.isOpen());
  }
}
