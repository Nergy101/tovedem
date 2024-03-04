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

export const routes: Routes = [
  {
    path: '',
    component: HomePaginaComponent,
  },
  {
    path: 'Agenda',
    component: AgendaComponent,
  },
  {
    path: 'Login',
    component: LoginComponent,
  },
  {
    path: 'Groep/Tovedem',
    component: GroepComponent,
  },
  {
    path: 'Groep/Cloos',
    component: GroepComponent,
  },
  {
    path: 'Groep/Mejotos',
    component: GroepComponent,
  },
  {
    path: 'Reserveren',
    component: ReserverenComponent,
  },
  {
    path: 'Reservering-geslaagd',
    component: ReserveringGeslaagdComponent,
  },
  {
    path: 'Vriend-Worden',
    component: VriendWordenComponent,
  },
  {
    path: 'Steunen',
    component: VriendWordenComponent,
  },
  {
    path: 'Lid-Worden',
    component: LidWordenComponent,
  },
  {
    path: 'Sinterklaas',
    component: SinterklaasComponent,
  },
  {
    path: 'Contact',
    component: ContactComponent,
  },
  {
    path: 'Profiel',
    component: ProfielComponent,
  },
  {
    path: 'PrivacyBeleid',
    component: PrivacyBeleidComponent,
  },
];
