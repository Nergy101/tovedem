import { Component, computed, input, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Sterrenbeoordeling (1 t/m max). Bewerkbaar via [(waarde)], of alleen-lezen
 * met [alleenLezen]="true".
 */
@Component({
  selector: 'app-sterren-beoordeling',
  imports: [MatIconModule],
  template: `
    <div
      class="sterren"
      [class.alleen-lezen]="alleenLezen()"
      role="radiogroup"
      [attr.aria-label]="label()"
    >
      @for (ster of sterren(); track ster) {
        @if (alleenLezen()) {
          <mat-icon class="ster" [class.gevuld]="ster <= waarde()">{{
            ster <= waarde() ? 'star' : 'star_border'
          }}</mat-icon>
        } @else {
          <button
            type="button"
            class="ster-knop"
            role="radio"
            [attr.aria-checked]="ster === waarde()"
            [attr.aria-label]="ster + (ster === 1 ? ' ster' : ' sterren')"
            (click)="waarde.set(ster)"
          >
            <mat-icon class="ster" [class.gevuld]="ster <= waarde()">{{
              ster <= waarde() ? 'star' : 'star_border'
            }}</mat-icon>
          </button>
        }
      }
    </div>
  `,
  styles: [
    `
      .sterren {
        display: inline-flex;
        align-items: center;
        gap: 2px;
      }

      .ster-knop {
        background: none;
        border: none;
        padding: 2px;
        cursor: pointer;
        border-radius: 50%;
        line-height: 0;
        transition: transform 0.15s ease;

        &:hover {
          transform: scale(1.15);
        }

        &:focus-visible {
          outline: 2px solid var(--mat-sys-primary);
        }
      }

      .ster {
        color: var(--mat-sys-outline) !important;
      }

      .ster.gevuld {
        color: #f5b301 !important;
      }

      .alleen-lezen .ster {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    `,
  ],
})
export class SterrenBeoordelingComponent {
  waarde = model(0);
  max = input(5);
  alleenLezen = input(false);

  sterren = computed(() =>
    Array.from({ length: this.max() }, (_, i) => i + 1)
  );

  label = computed(() => `${this.waarde()} van de ${this.max()} sterren`);
}
