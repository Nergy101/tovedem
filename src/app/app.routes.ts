import { Routes } from '@angular/router';
import { GroepComponent } from './pages/public/groep/groep.component';
import { AgendaComponent } from './pages/public/agenda/agenda.component';
import { PrivacyBeleidComponent } from './pages/public/privacy-beleid/privacy-beleid.component';
import { HomePaginaComponent } from './pages/public/home/home.component';
import { VriendWordenComponent } from './pages/public/vriend-worden/vriend-worden.component';
import { LidWordenComponent } from './pages/public/lid-worden/lid-worden.component';
import { ContactComponent } from './pages/public/contact/contact.component';
import { SinterklaasComponent } from './pages/public/sinterklaas/sinterklaas.component';
import { ReserverenComponent } from './pages/public/reserveren/reserveer-formulier/reserveren.component';
import { ReserveringGeslaagdComponent } from './pages/public/reserveren/reservering-geslaagd/reservering-geslaagd.component';
import { LoginComponent } from './pages/public/login/login.component';
import { ProfielComponent } from './pages/members/profiel/profiel.component';
import { BeheerReserveringenComponent } from './pages/members/beheer-reserveringen/beheer-reserveringen.component';
import { BeheerVoorstellingenComponent } from './pages/members/beheer-voorstellingen/beheer-voorstellingen.component';
import { BeheerLedenComponent } from './pages/members/beheer-leden/beheer-leden.component';
import { BeheerSpelersComponent } from './pages/members/beheer-spelers/beheer-spelers.component';

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
    path: 'profiel',
    component: ProfielComponent,
  },
  {
    path: 'privacy-beleid',
    component: PrivacyBeleidComponent,
  },
  {
    path: 'beheer-reserveringen',
    component: BeheerReserveringenComponent,
  },
  {
    path: 'beheer-voorstellingen',
    component: BeheerVoorstellingenComponent,
  },
  {
    path: 'beheer-leden',
    component: BeheerLedenComponent,
  },
  {
    path: 'beheer-spelers',
    component: BeheerSpelersComponent,
  },
];
