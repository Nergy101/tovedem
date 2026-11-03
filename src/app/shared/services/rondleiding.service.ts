import { Injectable, inject } from '@angular/core';
import { DriveStep, Driver, Side, driver } from 'driver.js';
import { AuthService } from './auth.service';

export interface RondleidingStap {
  /** CSS-selector van het element dat uitgelicht wordt; zonder selector wordt de stap gecentreerd getoond. */
  element?: string;
  titel: string;
  tekst: string;
  side?: Side;
  /** Wordt uitgevoerd voordat naar deze stap genavigeerd wordt (bijv. het zijmenu openen). */
  voorTonen?: () => Promise<void> | void;
}

export interface RondleidingOpties {
  /** Wordt aangeroepen als de rondleiding afgerond, overgeslagen of afgebroken is. */
  onAfgesloten?: () => void;
}

/**
 * Toont rondleidingen (driver.js) door een pagina en onthoudt per gebruiker
 * in localStorage of de rondleiding al eens gezien is.
 */
@Injectable({
  providedIn: 'root',
})
export class RondleidingService {
  private authService = inject(AuthService);
  private actieveRondleiding: Driver | null = null;

  isGezien(rondleidingId: string): boolean {
    try {
      return localStorage.getItem(this.storageKey(rondleidingId)) === 'true';
    } catch {
      return false;
    }
  }

  markeerAlsGezien(rondleidingId: string): void {
    try {
      localStorage.setItem(this.storageKey(rondleidingId), 'true');
    } catch {
      // localStorage niet beschikbaar (bijv. privé venster): dan maar opnieuw tonen
    }
  }

  /** Start de rondleiding alleen als de gebruiker hem nog niet eerder gezien heeft. */
  startAlsNietGezien(
    rondleidingId: string,
    stappen: RondleidingStap[],
    opties: RondleidingOpties = {}
  ): void {
    if (this.isGezien(rondleidingId)) return;
    this.start(rondleidingId, stappen, opties);
  }

  /** Start de rondleiding; afsluiten of afronden markeert hem als gezien. */
  start(
    rondleidingId: string,
    stappen: RondleidingStap[],
    opties: RondleidingOpties = {}
  ): void {
    // Sla stappen over waarvan het element (nog) niet zichtbaar op de pagina staat
    const zichtbareStappen = stappen.filter(
      (stap) => !stap.element || this.isZichtbaar(stap.element)
    );
    const steps: DriveStep[] = zichtbareStappen.map((stap) => ({
      element: stap.element,
      popover: {
        title: stap.titel,
        description: stap.tekst,
        side: stap.side,
      },
    }));

    if (steps.length === 0) {
      opties.onAfgesloten?.();
      return;
    }

    this.stop();
    const rondleiding = driver({
      steps,
      showProgress: true,
      progressText: '{{current}} van {{total}}',
      nextBtnText: 'Volgende',
      prevBtnText: 'Vorige',
      doneBtnText: 'Klaar',
      closeBtnLabel: 'Rondleiding overslaan',
      // Uitgelichte elementen zijn alleen ter illustratie; klikken zou bijv. echte data wijzigen
      disableActiveInteraction: true,
      popoverClass: 'tovedem-rondleiding',
      onPopoverRender: (popover, { driver: actief }) => {
        if (actief.isLastStep()) return;
        const overslaan = document.createElement('button');
        overslaan.innerText = 'Overslaan';
        overslaan.className = 'tovedem-rondleiding-overslaan';
        overslaan.addEventListener('click', () => actief.destroy());
        popover.footerButtons.prepend(overslaan);
      },
      onNextClick: async (_element, _step, { driver: actief }) => {
        const volgende = zichtbareStappen[(actief.getActiveIndex() ?? 0) + 1];
        if (!volgende) {
          actief.destroy();
          return;
        }
        await volgende.voorTonen?.();
        actief.moveNext();
      },
      onPrevClick: async (_element, _step, { driver: actief }) => {
        const vorige = zichtbareStappen[(actief.getActiveIndex() ?? 0) - 1];
        if (!vorige) return;
        await vorige.voorTonen?.();
        actief.movePrevious();
      },
      onDestroyed: () => {
        this.markeerAlsGezien(rondleidingId);
        this.actieveRondleiding = null;
        opties.onAfgesloten?.();
      },
    });

    this.actieveRondleiding = rondleiding;
    rondleiding.drive();
  }

  /** Sluit een eventueel lopende rondleiding (bijv. bij het verlaten van de pagina). */
  stop(): void {
    this.actieveRondleiding?.destroy();
  }

  private isZichtbaar(selector: string): boolean {
    const element = document.querySelector(selector);
    return !!element && element.getClientRects().length > 0;
  }

  private storageKey(rondleidingId: string): string {
    const gebruikerId = this.authService.userData()?.id ?? 'anoniem';
    return `rondleiding:${rondleidingId}:${gebruikerId}`;
  }
}
