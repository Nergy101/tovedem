import { NgComponentOutlet } from '@angular/common';
import { Component, Type, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

/** Eén tabblad op een beheerpagina; de bestaande pagina wordt pas geladen als het tabblad geopend wordt. */
export interface BeheerTabblad {
  /** Waarde van de query-parameter `tab`, bijv. `aanmeldingen`. */
  id: string;
  label: string;
  icon: string;
  laad: () => Promise<Type<unknown>>;
}

export interface BeheerTabbladenData {
  titel: string;
  tabbladen: BeheerTabblad[];
}

/**
 * Voegt meerdere beheerpagina's samen op één pagina met tabbladen.
 * Het open tabblad staat in de URL (`?tab=...`), zodat links en de terug-knop blijven werken.
 */
@Component({
  selector: 'app-beheer-tabbladen',
  imports: [NgComponentOutlet, MatTabsModule, MatIconModule, MatProgressBarModule],
  templateUrl: './beheer-tabbladen.component.html',
  styleUrl: './beheer-tabbladen.component.scss',
})
export class BeheerTabbladenComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private data = toSignal(
    this.route.data.pipe(map((data) => data as BeheerTabbladenData)),
    { initialValue: this.route.snapshot.data as BeheerTabbladenData }
  );
  private tabParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('tab'))),
    { initialValue: this.route.snapshot.queryParamMap.get('tab') }
  );

  titel = computed(() => this.data().titel);
  tabbladen = computed(() => this.data().tabbladen);

  geselecteerdeIndex = computed(() =>
    Math.max(
      0,
      this.tabbladen().findIndex((tab) => tab.id === this.tabParam())
    )
  );

  /** Geladen componenten per tabblad-id. */
  componenten = signal<Record<string, Type<unknown>>>({});

  constructor() {
    effect(() => {
      const tab = this.tabbladen()[this.geselecteerdeIndex()];
      if (tab && !this.componenten()[tab.id]) {
        void this.laadTabblad(tab);
      }
    });
  }

  kiesTabblad(index: number): void {
    const tab = this.tabbladen()[index];
    if (!tab || index === this.geselecteerdeIndex()) return;
    this.router.navigate([], {
      relativeTo: this.route,
      // Het eerste tabblad is de standaard; dan geen parameter in de URL
      queryParams: { tab: index === 0 ? null : tab.id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private async laadTabblad(tab: BeheerTabblad): Promise<void> {
    const component = await tab.laad();
    this.componenten.update((geladen) => ({ ...geladen, [tab.id]: component }));
  }
}
