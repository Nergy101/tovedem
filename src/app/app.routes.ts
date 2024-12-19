import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BeheerLedenComponent } from './pages/members/beheer-leden/beheer-leden.component';
import { BeheerMailsComponent } from './pages/members/beheer-mails/beheer-mails.component';
import { BeheerReserveringenComponent } from './pages/members/beheer-reserveringen/beheer-reserveringen.component';
import { BeheerSpelersComponent } from './pages/members/beheer-spelers/beheer-spelers.component';
import { BeheerVoorstellingenComponent } from './pages/members/beheer-voorstellingen/beheer-voorstellingen.component';
import { CommissieSinterklaasComponent } from './pages/members/commissie-sinterklaas/commissie-sinterklaas.component';
import { ProductieInfoComponent } from './pages/members/productie-info/productie-info.component';
import { ProfielComponent } from './pages/members/profiel/profiel.component';
import { AgendaComponent } from './pages/public/agenda/agenda.component';
import { ContactComponent } from './pages/public/contact/contact.component';
import { GroepComponent } from './pages/public/groep/groep.component';
import { HomePaginaComponent } from './pages/public/home/home.component';
import { LidWordenComponent } from './pages/public/lid-worden/lid-worden.component';
import { LoginComponent } from './pages/public/login/login.component';
import { PrivacyBeleidComponent } from './pages/public/privacy-beleid/privacy-beleid.component';
import { ReserverenComponent } from './pages/public/reserveren/reserveer-formulier/reserveren.component';
import { ReserveringAanpassenComponent } from './pages/public/reserveren/reservering-aanpassen/reservering-aanpassen.component';
import { ReserveringGeslaagdComponent } from './pages/public/reserveren/reservering-geslaagd/reservering-geslaagd.component';
import { SinterklaasComponent } from './pages/public/sinterklaas/sinterklaas.component';
import { VriendWordenComponent } from './pages/public/vriend-worden/vriend-worden.component';
import { AuthService } from './shared/services/auth.service';

export const routes: Routes = [
  {
    path: '',
    component: HomePaginaComponent,
  },
  {
    path: 'agenda',
    component: AgendaComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'groep/Tovedem',
    component: GroepComponent,
  },
  {
    path: 'groep/Cloos',
    component: GroepComponent,
  },
  {
    path: 'groep/Mejotos',
    component: GroepComponent,
  },
  {
    path: 'reserveren',
    component: ReserverenComponent,
  },
  {
    path: 'reservering-geslaagd',
    component: ReserveringGeslaagdComponent,
  },
  {
    path: 'vriend-worden',
    component: VriendWordenComponent,
  },
  {
    path: 'steunen',
    component: VriendWordenComponent,
  },
  {
    path: 'lid-worden',
    component: LidWordenComponent,
  },
  {
    path: 'sinterklaas',
    component: SinterklaasComponent,
  },
  {
    path: 'contact',
    component: ContactComponent,
  },
  {
    path: 'privacy-beleid',
    component: PrivacyBeleidComponent,
  },
  {
    path: 'profiel',
    component: ProfielComponent,
    canActivate: [loggedInGuard],
  },
  {
    path: 'beheer-reserveringen',
    component: BeheerReserveringenComponent,
    canActivate: [loggedInGuard(['admin'])],
  },
  {
    path: 'reservering-aanpassen/:id/:guid',
    component: ReserveringAanpassenComponent,
  },
  {
    path: 'beheer-voorstellingen',
    component: BeheerVoorstellingenComponent,
    canActivate: [loggedInGuard(['admin'])],
  },
  {
    path: 'beheer-leden',
    component: BeheerLedenComponent,
    canActivate: [loggedInGuard(['admin'])],
  },
  {
    path: 'beheer-spelers',
    component: BeheerSpelersComponent,
    canActivate: [loggedInGuard(['admin'])],
  },
  {
    path: 'beheer-mails',
    component: BeheerMailsComponent,
    canActivate: [loggedInGuard(['admin'])],
  },
  {
    path: 'productie-info/Tovedem',
    component: ProductieInfoComponent,
    canActivate: [loggedInGuard],
  },
  {
    path: 'productie-info/Cloos',
    component: ProductieInfoComponent,
    canActivate: [loggedInGuard],
  },
  {
    path: 'productie-info/Mejotos',
    component: ProductieInfoComponent,
    canActivate: [loggedInGuard],
  },
  {
    path: 'commissie-sinterklaas',
    component: CommissieSinterklaasComponent,
    canActivate: [loggedInGuard],
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
      if (authService.userHasAllRoles(requiredRoles)) {
        return true;
      }
    }

    toastr.error('Deze pagina bestaat niet');
    return router.createUrlTree([]);
  };
}
