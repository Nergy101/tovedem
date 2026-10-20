import { Component, input } from '@angular/core';
import { SkeletonComponent } from './skeleton.component';

type SkeletonGroupType = 'card-grid' | 'news-card' | 'table' | 'list' | 'form';

@Component({
  selector: 'app-skeleton-group',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    @switch (type()) {
      @case ('card-grid') {
        <div class="skeleton-card-grid">
          @for (i of repeatArray(); track $index) {
            <div class="skeleton-card">
              <app-skeleton variant="image" height="180px" />
              <div class="skeleton-card-body">
                <app-skeleton variant="text" width="60%" height="1.5rem" />
                <app-skeleton variant="text" width="40%" />
                <app-skeleton variant="text" width="90%" />
                <app-skeleton variant="text" width="80%" />
              </div>
            </div>
          }
        </div>
      }
      @case ('news-card') {
        <div class="skeleton-news-card">
          <div class="skeleton-news-text">
            <app-skeleton variant="text" width="50%" height="1.5rem" />
            <app-skeleton variant="text" width="30%" />
            <app-skeleton variant="text" width="100%" />
            <app-skeleton variant="text" width="95%" />
            <app-skeleton variant="text" width="85%" />
          </div>
          <app-skeleton variant="image" width="200px" height="150px" />
        </div>
      }
      @case ('table') {
        <div class="skeleton-table">
          <app-skeleton variant="table-row" width="100%" />
          @for (i of repeatArray(); track $index) {
            <app-skeleton variant="table-row" width="100%" />
          }
        </div>
      }
      @case ('list') {
        <div class="skeleton-list">
          @for (i of repeatArray(); track $index) {
            <div class="skeleton-list-item">
              <app-skeleton variant="circle" width="48px" height="48px" />
              <div class="skeleton-list-text">
                <app-skeleton variant="text" width="40%" />
                <app-skeleton variant="text" width="60%" />
              </div>
            </div>
          }
        </div>
      }
      @case ('form') {
        <div class="skeleton-form">
          @for (i of repeatArray(); track $index) {
            <app-skeleton variant="text" width="30%" height="0.875rem" />
            <app-skeleton variant="text" width="100%" height="3.5rem" borderRadius="8px" />
          }
        </div>
      }
    }
  `,
  styles: [`
    .skeleton-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .skeleton-card {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(125, 179, 232, 0.15);
    }

    .skeleton-card-body {
      padding: 1rem;
    }

    .skeleton-news-card {
      display: flex;
      gap: 1.5rem;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid rgba(125, 179, 232, 0.15);
    }

    .skeleton-news-text {
      flex: 1;
    }

    .skeleton-table {
      width: 100%;
    }

    .skeleton-list-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
    }

    .skeleton-list-text {
      flex: 1;
    }

    .skeleton-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    @media (max-width: 768px) {
      .skeleton-news-card {
        flex-direction: column;
      }
    }
  `],
})
export class SkeletonGroupComponent {
  type = input.required<SkeletonGroupType>();
  count = input(3);

  repeatArray(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
