/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
    providedIn: 'root'
})
export class SeoService {

    titleService = inject(Title);
    metaService = inject(Meta);

    update(title: string): void {
        this.updateTitle(title);
        this.updateMetaTags([{ name: 'description', content: title }]);
    }

    updateCustom(title: string, metaTags: { name: string, content: string }[]): void {
        this.updateTitle(title);
        this.updateMetaTags(metaTags);
    }

    updateStructuredData(data: any): void {
        this.metaService.addTag({ name: 'json+ld', content: JSON.stringify(data) });
    }

    private updateTitle(title: string): void {
        this.titleService.setTitle(title);
    }

    private updateMetaTags(metaTags: { name: string, content: string }[]): void {
        metaTags.forEach(tag => {
            this.metaService.updateTag({ name: tag.name, content: tag.content });
        });
    }
}