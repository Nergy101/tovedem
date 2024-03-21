import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BreakpointService {
  breakpointObserver = inject(BreakpointObserver);

  isMobileScreen: Signal<boolean | undefined>;
  isDesktopScreen: Signal<boolean | undefined>;

  constructor() {
    this.isMobileScreen = toSignal(
      this.breakpointObserver
        .observe('(max-width: 425px)')
        .pipe(map((x) => x.matches))
    );

    this.isDesktopScreen = toSignal(
      this.breakpointObserver
        .observe('(min-width: 1440px)')
        .pipe(map((x) => x.matches))
    );
  }
}
