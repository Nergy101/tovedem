/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  router = inject(Router);
  titleService = inject(Title);
  metaService = inject(Meta);

  update(title: string): void {
    this.updateTitle(title);
    this.updateMetaTags([{ name: 'description', content: title }]);
    this.updateCanonicalUrl(this.router.url);
  }

  updateStructuredData(data: any): void {
    this.metaService.addTag({ name: 'json+ld', content: JSON.stringify(data) });
  }

  private updateTitle(title: string): void {
    this.titleService.setTitle(title);
  }

  private updateCanonicalUrl(url: string): void {
    const link = this.metaService.getTag('rel="canonical"');
    if (!link) {
      this.metaService.addTag({ rel: 'canonical', href: url });
    } else {
      this.metaService.updateTag({ rel: 'canonical', href: url });
    }
  }

  private updateMetaTags(metaTags: { name: string; content: string }[]): void {
    metaTags.forEach((tag) => {
      this.metaService.updateTag({ name: tag.name, content: tag.content });
    });
  }
}
