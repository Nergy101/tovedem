import { Routes } from '@angular/router';
import { getRequiredRoles } from './shared/constants/route-access.config';
import { globalAdminGuard, loggedInGuard } from './shared/guards/auth.guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/public/home/home.component').then(
        (m) => m.HomePaginaComponent,
      ),
  },
  {
    path: 'agenda',
    loadComponent: () =>
      import('./pages/public/agenda/agenda.component').then(
        (m) => m.AgendaComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/public/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/public/signup/signup.component').then(
        (m) => m.SignupComponent,
      ),
  },
  {
    path: 'groep/Tovedem',
    loadComponent: () =>
      import('./pages/public/groep/groep.component').then(
        (m) => m.GroepComponent,
      ),
  },
  {
    path: 'groep/Cloos',
    loadComponent: () =>
      import('./pages/public/groep/groep.component').then(
        (m) => m.GroepComponent,
      ),
  },
  {
    path: 'groep/Mejotos',
    loadComponent: () =>
      import('./pages/public/groep/groep.component').then(
        (m) => m.GroepComponent,
      ),
  },
  {
    path: 'reserveren',
    loadComponent: () =>
      import('./pages/public/reserveren/reserveer-formulier/reserveren.component').then(
        (m) => m.ReserverenComponent,
      ),
  },
  {
    path: 'reservering-geslaagd',
    loadComponent: () =>
      import('./pages/public/reserveren/reservering-geslaagd/reservering-geslaagd.component').then(
        (m) => m.ReserveringGeslaagdComponent,
      ),
  },
  {
    path: 'steunen',
    loadComponent: () =>
      import('./pages/public/vriend-worden/vriend-worden.component').then(
        (m) => m.VriendWordenComponent,
      ),
  },
  {
    path: 'lid-worden',
    loadComponent: () =>
      import('./pages/public/lid-worden/lid-worden.component').then(
        (m) => m.LidWordenComponent,
      ),
  },
  {
    path: 'sinterklaas',
    loadComponent: () =>
      import('./pages/public/sinterklaas/sinterklaas.component').then(
        (m) => m.SinterklaasComponent,
      ),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/public/contact/contact.component').then(
        (m) => m.ContactComponent,
      ),
  },
  {
    path: 'privacy-beleid',
    loadComponent: () =>
      import('./pages/public/privacy-beleid/privacy-beleid.component').then(
        (m) => m.PrivacyBeleidComponent,
      ),
  },
  {
    path: 'profiel',
    loadComponent: () =>
      import('./pages/members/profiel/profiel.component').then(
        (m) => m.ProfielComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('profiel'))],
  },
  {
    path: 'beheer-reserveringen',
    loadComponent: () =>
      import('./pages/members/beheer-reserveringen/beheer-reserveringen.component').then(
        (m) => m.BeheerReserveringenComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('beheer-reserveringen'))],
  },
  {
    path: 'kassa',
    loadComponent: () =>
      import('./pages/members/kassa/kassa.component').then(
        (m) => m.KassaComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('kassa'))],
  },
  {
    path: 'printen',
    loadComponent: () =>
      import('./pages/members/printen/printen.component').then(
        (m) => m.PrintenComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('printen'))],
  },
  {
    path: 'reservering-aanpassen/:id/:guid',
    loadComponent: () =>
      import('./pages/public/reserveren/reservering-aanpassen/reservering-aanpassen.component').then(
        (m) => m.ReserveringAanpassenComponent,
      ),
    canActivate: [
      loggedInGuard(getRequiredRoles('reservering-aanpassen/:id/:guid')),
    ],
  },
  {
    path: 'beheer-voorstellingen',
    loadComponent: () =>
      import('./pages/members/beheer-voorstellingen/beheer-voorstellingen.component').then(
        (m) => m.BeheerVoorstellingenComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('beheer-voorstellingen'))],
  },
  {
    path: 'beheer-leden',
    loadComponent: () =>
      import('./pages/members/beheer-leden/beheer-leden.component').then(
        (m) => m.BeheerLedenComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('beheer-leden'))],
  },
  {
    path: 'beheer-spelers',
    loadComponent: () =>
      import('./pages/members/beheer-spelers/beheer-spelers.component').then(
        (m) => m.BeheerSpelersComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('beheer-spelers'))],
  },
  {
    path: 'beheer-mails',
    loadComponent: () =>
      import('./pages/members/beheer-mails/beheer-mails.component').then(
        (m) => m.BeheerMailsComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('beheer-mails'))],
  },
  {
    path: 'beheer-sponsoren',
    loadComponent: () =>
      import('./pages/members/beheer-sponsoren/beheer-sponsoren.component').then(
        (m) => m.BeheerSponsorenComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('beheer-sponsoren'))],
  },
  {
    path: 'beheer-nieuwe-leden',
    loadComponent: () =>
      import('./pages/members/beheer-nieuwe-leden/beheer-nieuwe-leden.component').then(
        (m) => m.BeheerNieuweLedenComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('beheer-nieuwe-leden'))],
  },
  {
    path: 'productie-info/Tovedem',
    loadComponent: () =>
      import('./pages/members/productie-info/productie-info.component').then(
        (m) => m.ProductieInfoComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('productie-info/Tovedem'))],
  },
  {
    path: 'productie-info/Cloos',
    loadComponent: () =>
      import('./pages/members/productie-info/productie-info.component').then(
        (m) => m.ProductieInfoComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('productie-info/Cloos'))],
  },
  {
    path: 'productie-info/Mejotos',
    loadComponent: () =>
      import('./pages/members/productie-info/productie-info.component').then(
        (m) => m.ProductieInfoComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('productie-info/Mejotos'))],
  },
  {
    path: 'commissie-sinterklaas',
    loadComponent: () =>
      import('./pages/members/commissie-sinterklaas/commissie-sinterklaas.component').then(
        (m) => m.CommissieSinterklaasComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('commissie-sinterklaas'))],
  },
  {
    path: 'galerij',
    loadComponent: () =>
      import('./pages/members/galerij/galerij.component').then(
        (m) => m.GalerijComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('galerij'))],
  },
  {
    path: 'galerij/:folderId',
    loadComponent: () =>
      import('./pages/members/galerij/folder-detail/folder-detail.component').then(
        (m) => m.FolderDetailComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('galerij/:folderId'))],
  },
  {
    path: 'beheer-nieuws',
    loadComponent: () =>
      import('./pages/members/beheer-nieuws/beheer-nieuws.component').then(
        (m) => m.BeheerNieuwsComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('beheer-nieuws'))],
  },
  {
    path: 'algemene-informatie',
    loadComponent: () =>
      import('./pages/members/algemene-informatie/algemene-informatie.component').then(
        (m) => m.AlgemeneInformatieComponent,
      ),
    canActivate: [loggedInGuard(getRequiredRoles('algemene-informatie'))],
  },
  {
    path: 'developers/rol-overzicht',
    loadComponent: () =>
      import('./pages/developers/rol-overzicht/rol-overzicht.component').then(
        (m) => m.RolOverzichtComponent,
      ),
    canActivate: [globalAdminGuard()],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/public/niet-gevonden/niet-gevonden.component').then(
        (m) => m.NietGevondenComponent,
      ),
  },
];
