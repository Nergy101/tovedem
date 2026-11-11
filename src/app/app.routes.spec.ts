import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

@Component({ template: '' })
class LegeComponent {}

describe('app routes: samengevoegde beheerpagina\'s', () => {
  const oudePaden = ['beheer-nieuwe-leden', 'beheer-vrienden', 'beheer-mail-lijst'];

  beforeEach(() => {
    // Alleen de doorverwijzingen zelf, met lege doelpagina's (zonder guards of lazy loading)
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          ...routes.filter((route) => oudePaden.includes(route.path ?? '')),
          { path: 'beheer-leden', component: LegeComponent },
          { path: 'beheer-sponsoren', component: LegeComponent },
          { path: 'beheer-mails', component: LegeComponent },
        ]),
      ],
    });
  });

  for (const [oud, nieuw] of [
    ['/beheer-nieuwe-leden', '/beheer-leden?tab=aanmeldingen'],
    ['/beheer-vrienden', '/beheer-sponsoren?tab=aanmeldingen'],
    ['/beheer-mail-lijst', '/beheer-mails?tab=mail-lijst'],
  ]) {
    it(`stuurt ${oud} door naar ${nieuw}`, async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(oud);
      expect(TestBed.inject(Router).url).toBe(nieuw);
    });
  }
});
