import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
    providedIn: 'root'
})
export class SeoService {

    titleService = inject(Title);
    metaService = inject(Meta);

    update(title: string) {
        this.updateTitle(title);
        this.updateMetaTags([{ name: 'description', content: title }]);
    }

    updateCustom(title: string, metaTags: { name: string, content: string }[]) {
        this.updateTitle(title);
        this.updateMetaTags(metaTags);
    }

    updateStructuredData(data: any) {
        this.metaService.addTag({ name: 'json+ld', content: JSON.stringify(data) });
    }

    private updateTitle(title: string) {
        this.titleService.setTitle(title);
    }

    private updateMetaTags(metaTags: { name: string, content: string }[]) {
        metaTags.forEach(tag => {
            this.metaService.updateTag({ name: tag.name, content: tag.content });
        });
    }
}