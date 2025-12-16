import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from './shared/services/auth.service';
import { Rol } from './models/domain/rol.model';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/public/home/home.component').then(
        (m) => m.HomePaginaComponent
      ),
  },
  {
    path: 'agenda',
    loadComponent: () =>
      import('./pages/public/agenda/agenda.component').then(
        (m) => m.AgendaComponent
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/public/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/public/signup/signup.component').then(
        (m) => m.SignupComponent
      ),
  },
  {
    path: 'groep/Tovedem',
    loadComponent: () =>
      import('./pages/public/groep/groep.component').then(
        (m) => m.GroepComponent
      ),
  },
  {
    path: 'groep/Cloos',
    loadComponent: () =>
      import('./pages/public/groep/groep.component').then(
        (m) => m.GroepComponent
      ),
  },
  {
    path: 'groep/Mejotos',
    loadComponent: () =>
      import('./pages/public/groep/groep.component').then(
        (m) => m.GroepComponent
      ),
  },
  {
    path: 'reserveren',
    loadComponent: () =>
      import(
        './pages/public/reserveren/reserveer-formulier/reserveren.component'
      ).then((m) => m.ReserverenComponent),
  },
  {
    path: 'reservering-geslaagd',
    loadComponent: () =>
      import(
        './pages/public/reserveren/reservering-geslaagd/reservering-geslaagd.component'
      ).then((m) => m.ReserveringGeslaagdComponent),
  },
  {
    path: 'steunen',
    loadComponent: () =>
      import('./pages/public/vriend-worden/vriend-worden.component').then(
        (m) => m.VriendWordenComponent
      ),
  },
  {
    path: 'lid-worden',
    loadComponent: () =>
      import('./pages/public/lid-worden/lid-worden.component').then(
        (m) => m.LidWordenComponent
      ),
  },
  {
    path: 'sinterklaas',
    loadComponent: () =>
      import('./pages/public/sinterklaas/sinterklaas.component').then(
        (m) => m.SinterklaasComponent
      ),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/public/contact/contact.component').then(
        (m) => m.ContactComponent
      ),
  },
  {
    path: 'privacy-beleid',
    loadComponent: () =>
      import('./pages/public/privacy-beleid/privacy-beleid.component').then(
        (m) => m.PrivacyBeleidComponent
      ),
  },
  {
    path: 'profiel',
    loadComponent: () =>
      import('./pages/members/profiel/profiel.component').then(
        (m) => m.ProfielComponent
      ),
    canActivate: [loggedInGuard],
  },
  {
    path: 'beheer-reserveringen',
    loadComponent: () =>
      import(
        './pages/members/beheer-reserveringen/beheer-reserveringen.component'
      ).then((m) => m.BeheerReserveringenComponent),
    canActivate: [loggedInGuard(['admin', 'bestuur', 'kassa'])],
  },
  {
    path: 'kassa',
    loadComponent: () =>
      import('./pages/members/kassa/kassa.component').then(
        (m) => m.KassaComponent
      ),
    canActivate: [loggedInGuard(['admin', 'bestuur', 'kassa'])],
  },
  {
    path: 'printen',
    loadComponent: () =>
      import('./pages/members/printen/printen.component').then(
        (m) => m.PrintenComponent
      ),
    canActivate: [loggedInGuard(['admin', 'bestuur', 'kassa', 'commissie'])],
  },
  {
    path: 'reservering-aanpassen/:id/:guid',
    loadComponent: () =>
      import(
        './pages/public/reserveren/reservering-aanpassen/reservering-aanpassen.component'
      ).then((m) => m.ReserveringAanpassenComponent),
    canActivate: [loggedInGuard],
  },
  {
    path: 'beheer-voorstellingen',
    loadComponent: () =>
      import(
        './pages/members/beheer-voorstellingen/beheer-voorstellingen.component'
      ).then((m) => m.BeheerVoorstellingenComponent),
    canActivate: [loggedInGuard(['admin', 'bestuur'])],
  },
  {
    path: 'beheer-leden',
    loadComponent: () =>
      import('./pages/members/beheer-leden/beheer-leden.component').then(
        (m) => m.BeheerLedenComponent
      ),
    canActivate: [loggedInGuard(['admin', 'bestuur'])],
  },
  {
    path: 'beheer-spelers',
    loadComponent: () =>
      import('./pages/members/beheer-spelers/beheer-spelers.component').then(
        (m) => m.BeheerSpelersComponent
      ),
    canActivate: [loggedInGuard(['admin', 'bestuur'])],
  },
  {
    path: 'beheer-mails',
    loadComponent: () =>
      import('./pages/members/beheer-mails/beheer-mails.component').then(
        (m) => m.BeheerMailsComponent
      ),
    canActivate: [loggedInGuard(['admin', 'bestuur'])],
  },
  {
    path: 'beheer-sponsoren',
    loadComponent: () =>
      import(
        './pages/members/beheer-sponsoren/beheer-sponsoren.component'
      ).then((m) => m.BeheerSponsorenComponent),
    canActivate: [loggedInGuard(['admin', 'bestuur'])],
  },
  {
    path: 'beheer-nieuwe-leden',
    loadComponent: () =>
      import(
        './pages/members/beheer-nieuwe-leden/beheer-nieuwe-leden.component'
      ).then((m) => m.BeheerNieuweLedenComponent),
    canActivate: [loggedInGuard],
  },
  {
    path: 'productie-info/Tovedem',
    loadComponent: () =>
      import('./pages/members/productie-info/productie-info.component').then(
        (m) => m.ProductieInfoComponent
      ),
    canActivate: [loggedInGuard(['lid'])],
  },
  {
    path: 'productie-info/Cloos',
    loadComponent: () =>
      import('./pages/members/productie-info/productie-info.component').then(
        (m) => m.ProductieInfoComponent
      ),
    canActivate: [loggedInGuard(['admin', 'bestuur', 'lid'])],
  },
  {
    path: 'productie-info/Mejotos',
    loadComponent: () =>
      import('./pages/members/productie-info/productie-info.component').then(
        (m) => m.ProductieInfoComponent
      ),
    canActivate: [loggedInGuard(['admin', 'bestuur', 'lid'])],
  },
  {
    path: 'commissie-sinterklaas',
    loadComponent: () =>
      import(
        './pages/members/commissie-sinterklaas/commissie-sinterklaas.component'
      ).then((m) => m.CommissieSinterklaasComponent),
    canActivate: [loggedInGuard(['admin', 'bestuur', 'commissie'])],
  },
  {
    path: 'gallerij',
    loadComponent: () =>
      import('./pages/members/gallerij/gallerij.component').then(
        (m) => m.GallerijComponent
      ),
    canActivate: [loggedInGuard(['admin', 'bestuur', 'commissie', 'lid'])],
  },
  {
    path: 'gallerij/:folderId',
    loadComponent: () =>
      import(
        './pages/members/gallerij/folder-detail/folder-detail.component'
      ).then((m) => m.FolderDetailComponent),
    canActivate: [loggedInGuard(['admin', 'bestuur', 'commissie', 'lid'])],
  },
  {
    path: 'beheer-nieuws',
    loadComponent: () =>
      import('./pages/members/beheer-nieuws/beheer-nieuws.component').then(
        (m) => m.BeheerNieuwsComponent
      ),
    canActivate: [loggedInGuard(['admin', 'bestuur'])],
  },
];

function loggedInGuard(requiredRoles: string[] = []): CanActivateFn {
  return () => {
    const router = inject(Router);
    const toastr = inject(ToastrService);
    const authService = inject(AuthService);

    // Allow Admins
    if (authService.isGlobalAdmin) {
      return true;
    }

    // Check normal users
    if (requiredRoles.length == 0 && authService.isLoggedIn()) {
      return true;
    } else if (requiredRoles.length > 0 && authService.isLoggedIn()) {
      // Check if user has ANY of the required roles (not all)
      if (authService.userHasAnyRole(requiredRoles)) {
        return true;
      }
    }

    toastr.error('Deze pagina bestaat niet');
    return router.createUrlTree([]);
  };
}

function loggedInGuardNieuwsCommissie(): CanActivateFn {
  return () => {
    const router = inject(Router);
    const toastr = inject(ToastrService);
    const authService = inject(AuthService);

    // Allow superusers
    if (authService.isGlobalAdmin) {
      return true;
    }

    // Check if user is logged in
    if (!authService.isLoggedIn()) {
      toastr.error('Deze pagina bestaat niet');
      return router.createUrlTree([]);
    }

    // Check if user has one of the required roles: admin, commissie, or beheer
    const userRoles =
      authService.userData()?.expand?.rollen?.map((r: Rol) => r.rol) || [];

    if (
      userRoles.includes('admin') ||
      userRoles.includes('commissie') ||
      userRoles.includes('beheer')
    ) {
      return true;
    }

    toastr.error('Deze pagina bestaat niet');
    return router.createUrlTree([]);
  };
}
