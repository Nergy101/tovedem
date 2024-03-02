import { Routes } from '@angular/router';
import { GroepComponent } from './pages/groep/groep.component';
import { AgendaComponent } from './pages/agenda/agenda.component';
import { PrivacyBeleidComponent } from './pages/privacy-beleid/privacy-beleid.component';
import { HomePaginaComponent } from './pages/home/home.component';
import { VriendWordenComponent } from './pages/vriend-worden/vriend-worden.component';
import { LidWordenComponent } from './pages/lid-worden/lid-worden.component';
import { ContactComponent } from './pages/contact/contact.component';
import { SinterklaasComponent } from './pages/sinterklaas/sinterklaas.component';
import { ReserverenComponent } from './pages/reserveren/reserveer-formulier/reserveren.component';
import { ReserveringGeslaagdComponent } from './pages/reserveren/reservering-geslaagd/reservering-geslaagd.component';
import { LoginComponent } from './pages/login/login.component';
import { ProfielComponent } from './pages/profiel/profiel.component';

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
