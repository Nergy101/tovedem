import {
  Injectable,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Gebruiker } from '../../models/domain/gebruiker.model';
import { Rol } from '../../models/domain/rol.model';
import { PocketbaseService } from './pocketbase.service';
import { SideDrawerService } from './side-drawer.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  sideDrawerService = inject(SideDrawerService);
  client = inject(PocketbaseService).client;

  public userRecord: WritableSignal<Gebruiker | null | undefined> =
    signal<Gebruiker | null | undefined>(undefined);

  public userData: Signal<Gebruiker | null> = computed(() => {
    return this.userRecord() ?? null;
  });

  get isGlobalAdmin(): boolean {
    return this.client?.authStore?.model?.collectionName === "_superusers";
  }

  public isLoggedIn: Signal<boolean> = computed(() => {
    const userRecord = this.userRecord();
    return !!userRecord;
  });

  constructor() {
    // check the localstorage for userData
    const existingUserData = this.client.authStore.record as unknown as Gebruiker;

    if (existingUserData) {
      if (this.client.authStore.isValid) {
        this.registerUser(existingUserData);
      } else {
        this.unregisterUser();
      }
    }
  }

  userHasAllRoles(roles: string[]): boolean {
    if (this.userData()?.expand?.rollen) {
      const rollenVanGebruiker = this.userData()?.expand?.rollen?.map(
        (r: Rol) => r.rol
      );

      return roles.every((role) => rollenVanGebruiker.includes(role));
    }
    return false;
  }

  registerUser(userRecord: Gebruiker): void {
    this.userRecord.set(userRecord);
    this.sideDrawerService.open();
  }

  unregisterUser() {
    this.sideDrawerService.close();
    this.userRecord.set(null);
    this.client.authStore.clear();
  }
}
