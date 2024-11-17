import {
  Injectable,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AdminModel } from 'pocketbase';
import { SideDrawerService } from './side-drawer.service';
import { Gebruiker } from '../../models/domain/gebruiker.model';
import { PocketbaseService } from './pocketbase.service';
import { Rol } from '../../models/domain/rol.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  sideDrawerService = inject(SideDrawerService);
  client = inject(PocketbaseService).client;

  public userRecord: WritableSignal<Gebruiker | AdminModel | null | undefined> =
    signal<Gebruiker | null | undefined>(undefined);

  public userData: Signal<Gebruiker | AdminModel | null> = computed(() => {
    return this.userRecord() ?? null;
  });

  get isGlobalAdmin(): boolean {
    return this.client?.authStore?.isAdmin ?? false;
  }

  public isLoggedIn: Signal<boolean> = computed(() => {
    const userRecord = this.userRecord();
    return !!userRecord;
  });

  constructor() {
    // check the localstorage for userData
    const existingUserData = this.client.authStore.model as Gebruiker;

    if (!!existingUserData) {
      if (this.client.authStore.isValid) {
        this.registerUser(existingUserData);
      } else {
        this.unregisterUser();
      }
    }
  }

  userHasAllRoles(roles: string[]): boolean {
    if (!!this.userData()?.expand?.rollen) {
      const rollenVanGebruiker = this.userData()?.expand?.rollen?.map(
        (r: Rol) => r.rol
      );

      return roles.every((role) => rollenVanGebruiker.includes(role));
    }
    return false;
  }

  registerUser(userRecord: Gebruiker | AdminModel): void {
    this.userRecord.set(userRecord);
    this.sideDrawerService.open();
  }

  unregisterUser() {
    this.sideDrawerService.close();
    this.userRecord.set(null);
    this.client.authStore.clear();
  }
}
