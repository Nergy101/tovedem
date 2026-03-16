import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

/**
 * Use on an <img>: loads the image only when in viewport via fetch + AbortController.
 * When the image scrolls out of view, any in-flight request is aborted.
 * Once an image has loaded and been displayed, it stays visible (no clear on scroll out).
 */
@Directive({
  selector: 'img[appCancelViewportImage]',
  standalone: true,
})
export class CancelViewportImageDirective implements OnInit, OnDestroy {
  @Input({ required: true }) imageUrl!: string;
  @Input() imageId?: string;

  @Output() unloaded = new EventEmitter<string>();

  private abortController: AbortController | null = null;
  private blobUrl: string | null = null;
  private observer: IntersectionObserver | null = null;
  /** True zodra de afbeelding geladen en getoond is; dan niet meer clearen bij uit beeld. */
  private hasLoadedAndDisplayed = false;
  private isInViewport = false;
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private static readonly RETRY_DELAY_MS = 3000;

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target !== this.el.nativeElement) continue;
          this.isInViewport = entry.isIntersecting;
          if (entry.isIntersecting) {
            this.clearRetryTimeout();
            this.load();
          } else {
            this.cancel();
          }
        }
      },
      {
        rootMargin: '400px',
        threshold: 0.01,
      }
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.hasLoadedAndDisplayed = false;
    this.isInViewport = false;
    this.clearRetryTimeout();
    this.cancel();
  }

  private clearRetryTimeout(): void {
    if (this.retryTimeoutId != null) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }

  private scheduleRetry(): void {
    this.clearRetryTimeout();
    this.retryTimeoutId = setTimeout(() => {
      this.retryTimeoutId = null;
      if (this.isInViewport && !this.hasLoadedAndDisplayed) {
        this.load();
      }
    }, CancelViewportImageDirective.RETRY_DELAY_MS);
  }

  private cancel(): void {
    this.clearRetryTimeout();
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.hasLoadedAndDisplayed) {
      return;
    }
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    this.el.nativeElement.src = '';
    this.el.nativeElement.removeAttribute('src');
    if (this.imageId) {
      this.unloaded.emit(this.imageId);
    }
  }

  private load(): void {
    const url = this.imageUrl;
    if (!url) return;
    if (this.hasLoadedAndDisplayed && this.el.nativeElement.src) return;

    this.clearRetryTimeout();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    fetch(url, { signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        if (signal.aborted) return;
        if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
        this.blobUrl = URL.createObjectURL(blob);
        this.el.nativeElement.src = this.blobUrl;
        this.hasLoadedAndDisplayed = true;
      })
      .catch((err) => {
        this.el.nativeElement.src = '';
        if (this.isInViewport && !this.hasLoadedAndDisplayed) {
          this.scheduleRetry();
        }
      });
  }
}
