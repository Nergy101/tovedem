import { ApplicationConfig, ErrorHandler, importProvidersFrom } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';

import {
  provideAnimations,
  provideNoopAnimations,
} from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RECAPTCHA_LOADER_OPTIONS, RECAPTCHA_SETTINGS, RECAPTCHA_V3_SITE_KEY, RecaptchaSettings, RecaptchaV3Module } from 'ng-recaptcha';
import { provideToastr } from 'ngx-toastr';
import { Environment } from '../environment';
import { environment } from '../environment/environment.dev';
import { routes } from './app.routes';
import { CustomErrorHandlerService } from './shared/services/custom-error-handler.service';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      })
    ),
    provideAnimationsAsync(),
    provideNoopAnimations(),
    provideAnimations(),
    provideHttpClient(),
    provideToastr({
      preventDuplicates: true,
    }),
    {
      provide: ErrorHandler,
      useClass: CustomErrorHandlerService,
    },
    {
      provide: Environment,
      useValue: environment
    },
    importProvidersFrom(RecaptchaV3Module),
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.captchaSiteKey
    },
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: { siteKey: environment.captchaSiteKey, } as RecaptchaSettings,
    },
    {
      provide: RECAPTCHA_LOADER_OPTIONS,
      useValue: { language: 'nl' },
    },
  ],
};
