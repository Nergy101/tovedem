import { ApplicationConfig, ErrorHandler } from '@angular/core';
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
import { provideToastr } from 'ngx-toastr';
import { routes } from './app.routes';
import { CustomErrorHandlerService } from './shared/services/custom-error-handler.service';
import { environment } from '../environment/environment.dev';
import { Environment } from '../environment';

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
    }
  ],
};
