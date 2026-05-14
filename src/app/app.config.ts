import {
  APP_INITIALIZER,
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';

import {
  RECAPTCHA_LOADER_OPTIONS,
  RECAPTCHA_SETTINGS,
  RECAPTCHA_V3_SITE_KEY,
  RecaptchaSettings,
  RecaptchaV3Module,
} from 'ng-recaptcha';
import { provideToastr } from 'ngx-toastr';
import { Environment } from '../environment';
import { environment } from '../environment/environment.dev';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CustomErrorHandlerService } from './shared/services/custom-error-handler.service';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { errorInterceptor } from './shared/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      })
    ),
    provideHttpClient(withInterceptors([errorInterceptor])),
    provideToastr({
      preventDuplicates: true,
      positionClass: 'toast-bottom-right',
    }),
    {
      provide: ErrorHandler,
      useClass: CustomErrorHandlerService,
    },
    {
      provide: Environment,
      useFactory: () => {
        const w = (window as any).APP_ENV ?? {};
        return Object.assign(new Environment(), {
          production: w.PRODUCTION === 'true',
          pocketbase: {
            baseUrl:  w.POCKETBASE_BASE_URL  || environment.pocketbase.baseUrl,
            adminUrl: w.POCKETBASE_ADMIN_URL || environment.pocketbase.adminUrl,
          },
          captchaSiteKey: w.CAPTCHA_SITE_KEY  || environment.captchaSiteKey,
          kumaStatusUrl:  w.KUMA_STATUS_URL   || environment.kumaStatusUrl,
          umami: w.UMAMI_SCRIPT_URL
            ? { scriptUrl: w.UMAMI_SCRIPT_URL, websiteId: w.UMAMI_WEBSITE_ID }
            : environment.umami,
          version: environment.version,
        });
      },
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (env: Environment, doc: Document) => () => {
        if (env.umami) {
          const script = doc.createElement('script');
          script.defer = true;
          script.src = env.umami.scriptUrl;
          script.dataset['websiteId'] = env.umami.websiteId;
          doc.head.appendChild(script);
        }
      },
      deps: [Environment, DOCUMENT],
      multi: true,
    },
    importProvidersFrom(RecaptchaV3Module),
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.captchaSiteKey,
    },
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: { siteKey: environment.captchaSiteKey } as RecaptchaSettings,
    },
    {
      provide: RECAPTCHA_LOADER_OPTIONS,
      useValue: { language: 'nl' },
    },
  ],
};
