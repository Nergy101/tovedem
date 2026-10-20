import { Component, input } from '@angular/core';

type SkeletonVariant = 'text' | 'card' | 'image' | 'circle' | 'table-row' | 'list-item';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div
      class="skeleton"
      [class.skeleton--text]="variant() === 'text'"
      [class.skeleton--card]="variant() === 'card'"
      [class.skeleton--image]="variant() === 'image'"
      [class.skeleton--circle]="variant() === 'circle'"
      [class.skeleton--table-row]="variant() === 'table-row'"
      [class.skeleton--list-item]="variant() === 'list-item'"
      [style.width]="width()"
      [style.height]="height()"
      [style.borderRadius]="borderRadius()"
      aria-hidden="true"
    ></div>
  `,
  styles: [`
    .skeleton {
      display: block;
      background: linear-gradient(
        90deg,
        var(--skeleton-base, rgba(125, 179, 232, 0.12)) 25%,
        var(--skeleton-highlight, rgba(125, 179, 232, 0.22)) 50%,
        var(--skeleton-base, rgba(125, 179, 232, 0.12)) 75%
      );
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.4s ease-in-out infinite;
    }

    :host-context(html.darkMode) .skeleton {
      --skeleton-base: rgba(125, 179, 232, 0.1);
      --skeleton-highlight: rgba(125, 179, 232, 0.2);
    }

    :host-context(html.lightMode) .skeleton {
      --skeleton-base: rgba(125, 179, 232, 0.15);
      --skeleton-highlight: rgba(125, 179, 232, 0.3);
    }

    .skeleton--text {
      height: 1rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }

    .skeleton--card {
      border-radius: 12px;
      min-height: 200px;
    }

    .skeleton--image {
      border-radius: 8px;
      aspect-ratio: 16 / 9;
      width: 100%;
    }

    .skeleton--circle {
      border-radius: 50%;
      aspect-ratio: 1;
    }

    .skeleton--table-row {
      height: 3rem;
      border-radius: 4px;
      margin-bottom: 0.25rem;
    }

    .skeleton--list-item {
      height: 4rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }

    @keyframes skeleton-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class SkeletonComponent {
  variant = input<SkeletonVariant>('text');
  width = input<string>('100%');
  height = input<string | null>(null);
  borderRadius = input<string | null>(null);
}
