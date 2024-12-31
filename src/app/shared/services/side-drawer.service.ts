import { effect, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SideDrawerService {
  isOpen = signal(true);

  constructor() {
    const sideDrawerOpen = localStorage.getItem('sideDrawerOpen');
    this.isOpen.set(sideDrawerOpen === 'true');

    effect(() => {
      console.log('isOpen', this.isOpen());
    });
  }

  open(): void {
    console.log('open');
    this.isOpen.set(true);
    localStorage.setItem('sideDrawerOpen', 'true');
  }

  close(): void {
    console.log('close');
    this.isOpen.set(false);
    localStorage.setItem('sideDrawerOpen', 'false');
  }
}
