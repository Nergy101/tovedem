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
  private readonly baseUrl = 'https://tovedem.nergy.space';

  update(title: string, description?: string): void {
    this.updateTitle(title);
    const metaDescription = description || title;
    this.updateMetaTags([{ name: 'description', content: metaDescription }]);
    this.updateCanonicalUrl(window.location.href);
  }

  updateStructuredData(data: any): void {
    // Remove existing structured data
    this.removeStructuredData();
    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    script.id = 'structured-data';
    document.head.appendChild(script);
  }

  updateStructuredDataForEvent(event: {
    name: string;
    startDate: string;
    endDate?: string;
    location: {
      name: string;
      address: {
        streetAddress: string;
        addressLocality: string;
        postalCode: string;
        addressCountry: string;
      };
    };
    description?: string;
    image?: string;
    performer?: {
      name: string;
      '@type'?: string;
    };
    organizer?: {
      name: string;
      url?: string;
    };
    offers?: {
      price: number;
      priceCurrency: string;
      availability: string;
      url?: string;
    };
  }): void {
    const eventData = {
      '@context': 'https://schema.org',
      '@type': 'TheaterEvent',
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate || event.startDate,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: {
        '@type': 'Place',
        name: event.location.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: event.location.address.streetAddress,
          addressLocality: event.location.address.addressLocality,
          postalCode: event.location.address.postalCode,
          addressCountry: event.location.address.addressCountry,
        },
      },
      ...(event.description && { description: event.description }),
      ...(event.image && { image: event.image }),
      ...(event.performer && {
        performer: {
          '@type': event.performer['@type'] || 'TheaterGroup',
          name: event.performer.name,
        },
      }),
      ...(event.organizer && {
        organizer: {
          '@type': 'Organization',
          name: event.organizer.name,
          ...(event.organizer.url && { url: event.organizer.url }),
        },
      }),
      ...(event.offers && {
        offers: {
          '@type': 'Offer',
          price: event.offers.price,
          priceCurrency: event.offers.priceCurrency,
          availability: event.offers.availability,
          ...(event.offers.url && { url: event.offers.url }),
        },
      }),
    };
    this.updateStructuredData(eventData);
  }

  updateStructuredDataForArticle(article: {
    headline: string;
    datePublished: string;
    dateModified?: string;
    author?: string;
    image?: string;
    description?: string;
    url?: string;
  }): void {
    const articleData = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.headline,
      datePublished: article.datePublished,
      dateModified: article.dateModified || article.datePublished,
      ...(article.author && {
        author: {
          '@type': 'Organization',
          name: article.author,
        },
      }),
      publisher: {
        '@type': 'Organization',
        name: 'Tovedem',
        logo: {
          '@type': 'ImageObject',
          url: `${this.baseUrl}/assets/tovedem_logo.png`,
        },
      },
      ...(article.image && { image: article.image }),
      ...(article.description && { description: article.description }),
      ...(article.url && { mainEntityOfPage: { '@type': 'WebPage', '@id': article.url } }),
    };
    this.updateStructuredData(articleData);
  }

  updateStructuredDataForOrganization(organization: {
    name: string;
    description?: string;
    url?: string;
    logo?: string;
    image?: string[];
    sameAs?: string[];
  }): void {
    const orgData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: organization.name,
      ...(organization.description && { description: organization.description }),
      ...(organization.url && { url: organization.url }),
      ...(organization.logo && {
        logo: {
          '@type': 'ImageObject',
          url: organization.logo,
        },
      }),
      ...(organization.image && { image: organization.image }),
      ...(organization.sameAs && { sameAs: organization.sameAs }),
    };
    this.updateStructuredData(orgData);
  }

  updateStructuredDataForLocalBusiness(business: {
    name: string;
    address: {
      streetAddress: string;
      addressLocality: string;
      postalCode: string;
      addressCountry: string;
    };
    telephone?: string;
    email?: string;
    url?: string;
    priceRange?: string;
    openingHours?: string[];
  }): void {
    const businessData = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${this.baseUrl}/contact`,
      name: business.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: business.address.streetAddress,
        addressLocality: business.address.addressLocality,
        postalCode: business.address.postalCode,
        addressCountry: business.address.addressCountry,
      },
      ...(business.telephone && { telephone: business.telephone }),
      ...(business.email && { email: business.email }),
      ...(business.url && { url: business.url }),
      ...(business.priceRange && { priceRange: business.priceRange }),
      ...(business.openingHours && { openingHoursSpecification: business.openingHours.map((hours) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: hours,
      })) }),
    };
    this.updateStructuredData(businessData);
  }

  updateOpenGraphTags(tags: {
    title: string;
    description: string;
    image?: string;
    url?: string;
    type?: string;
    siteName?: string;
  }): void {
    const ogTags = [
      { property: 'og:title', content: tags.title },
      { property: 'og:description', content: tags.description },
      { property: 'og:type', content: tags.type || 'website' },
      { property: 'og:url', content: tags.url || window.location.href },
      { property: 'og:image', content: tags.image || `${this.baseUrl}/assets/tovedem_logo_klein.png` },
      ...(tags.siteName ? [{ property: 'og:site_name', content: tags.siteName }] : []),
    ];

    ogTags.forEach((tag) => {
      const existingTag = this.metaService.getTag(`property="${tag.property}"`);
      if (existingTag) {
        this.metaService.updateTag(tag);
      } else {
        this.metaService.addTag(tag);
      }
    });

    // Add Twitter Card tags
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: tags.title },
      { name: 'twitter:description', content: tags.description },
      ...(tags.image ? [{ name: 'twitter:image', content: tags.image }] : []),
    ];

    twitterTags.forEach((tag) => {
      const existingTag = this.metaService.getTag(`name="${tag.name}"`);
      if (existingTag) {
        this.metaService.updateTag(tag);
      } else {
        this.metaService.addTag(tag);
      }
    });
  }

  private removeStructuredData(): void {
    const existingScript = document.getElementById('structured-data');
    if (existingScript) {
      existingScript.remove();
    }
    // Also remove any existing json+ld meta tags
    const existingMeta = this.metaService.getTag('name="json+ld"');
    if (existingMeta) {
      this.metaService.removeTag('name="json+ld"');
    }
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
      const existingTag = this.metaService.getTag(`name="${tag.name}"`);
      if (existingTag) {
        this.metaService.updateTag({ name: tag.name, content: tag.content });
      } else {
        this.metaService.addTag({ name: tag.name, content: tag.content });
      }
    });
  }
}
