import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="empty-state" role="status">
      <div class="empty-state-icon" aria-hidden="true">
        <mat-icon>{{ icon() }}</mat-icon>
      </div>
      <h3 class="empty-state-title">{{ title() }}</h3>
      <p class="empty-state-description">{{ description() }}</p>
      @if (actionLabel()) {
        <button
          mat-flat-button
          color="primary"
          class="empty-state-action"
          (click)="actionClick.emit()"
        >
          <mat-icon aria-hidden="true">{{ actionIcon() }}</mat-icon>
          {{ actionLabel() }}
        </button>
      }
      @if (secondaryActionLabel()) {
        <button
          mat-stroked-button
          color="primary"
          class="empty-state-secondary-action"
          (click)="secondaryActionClick.emit()"
        >
          {{ secondaryActionLabel() }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1.5rem;
      gap: 0.5rem;
    }

    .empty-state-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: rgba(125, 179, 232, 0.1);
      margin-bottom: 0.5rem;
    }

    .empty-state-icon mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--mat-sys-primary, #7db3e8);
    }

    :host-context(html.darkMode) .empty-state-icon {
      background-color: rgba(125, 179, 232, 0.15);
    }

    .empty-state-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .empty-state-description {
      font-size: 0.95rem;
      opacity: 0.7;
      max-width: 400px;
      margin: 0 0 1rem;
      line-height: 1.5;
    }

    .empty-state-action {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 44px;
    }

    .empty-state-action mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .empty-state-secondary-action {
      margin-top: 0.5rem;
      min-height: 44px;
    }
  `],
})
export class EmptyStateComponent {
  icon = input<string>('inbox');
  title = input.required<string>();
  description = input.required<string>();
  actionLabel = input<string>('');
  actionIcon = input<string>('add');
  secondaryActionLabel = input<string>('');
  actionClick = output<void>();
  secondaryActionClick = output<void>();
}
