import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';
import { SideDrawerService } from '../../../shared/services/side-drawer.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let router: Router;
  let navigateSpy: jasmine.Spy;
  let usersAuthSpy: jasmine.Spy;
  let superusersAuthSpy: jasmine.Spy;
  let collectionSpy: jasmine.Spy;

  beforeEach(async () => {
    // Default: resolve with no record so no unhandled rejection; override in tests that need success or failure
    usersAuthSpy = jasmine.createSpy('authWithPassword').and.returnValue(Promise.resolve({ record: null }));
    superusersAuthSpy = jasmine.createSpy('authWithPassword').and.returnValue(Promise.resolve({ record: null }));
    collectionSpy = jasmine.createSpy('collection').and.callFake((name: string) => {
      if (name === 'users') return { authWithPassword: usersAuthSpy };
      if (name === '_superusers') return { authWithPassword: superusersAuthSpy };
      return {};
    });

    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['registerUser']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: PocketbaseService,
          useValue: { client: { collection: collectionSpy } },
        },
        { provide: SeoService, useValue: jasmine.createSpyObj('SeoService', ['update']) },
        { provide: SideDrawerService, useValue: jasmine.createSpyObj('SideDrawerService', ['open']) },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call auth when form is invalid', async () => {
    component.loginModel.set({ usernameOrEmail: '', password: '' });
    await component.login();
    expect(collectionSpy).not.toHaveBeenCalled();
  });

  it('should call authWithPassword with form values when form is valid', async () => {
    component.loginModel.set({
      usernameOrEmail: 'test@example.com',
      password: 'secret',
    });
    usersAuthSpy.and.returnValue(
      Promise.resolve({
        record: { id: '1', email: 'test@example.com', expand: { rollen: [] } },
      })
    );

    await component.login();

    expect(collectionSpy).toHaveBeenCalledWith('users');
    expect(usersAuthSpy).toHaveBeenCalledWith(
      'test@example.com',
      'secret',
      jasmine.objectContaining({ expand: 'groep,rollen' })
    );
  });

  it('should call registerUser and navigate to profiel on successful login', async () => {
    const fakeRecord = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      name: 'Test User',
      rollen: ['lid'],
      expand: { rollen: [{ rol: 'lid' }] },
    };
    component.loginModel.set({
      usernameOrEmail: 'test@example.com',
      password: 'secret',
    });
    usersAuthSpy.and.returnValue(Promise.resolve({ record: fakeRecord }));

    await component.login();

    expect(authServiceMock.registerUser).toHaveBeenCalledWith(fakeRecord);
    expect(navigateSpy).toHaveBeenCalledWith(['profiel']);
    expect(component.loginError()).toBeNull();
  });

  it('should set loginError and not navigate on auth failure', async () => {
    component.loginModel.set({
      usernameOrEmail: 'wrong@example.com',
      password: 'wrong',
    });
    usersAuthSpy.and.returnValue(Promise.reject(new Error('invalid')));
    superusersAuthSpy.and.returnValue(Promise.reject(new Error('invalid')));

    await component.login();

    expect(component.loginError()).toBe('E-mail/gebruikersnaam of wachtwoord is onjuist');
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(authServiceMock.registerUser).not.toHaveBeenCalled();
  });
});
