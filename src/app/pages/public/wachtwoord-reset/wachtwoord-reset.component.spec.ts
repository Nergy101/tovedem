import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';
import { WachtwoordResetComponent } from './wachtwoord-reset.component';

describe('WachtwoordResetComponent', () => {
  let component: WachtwoordResetComponent;
  let fixture: ComponentFixture<WachtwoordResetComponent>;
  let usersConfirmSpy: jasmine.Spy;
  let superusersConfirmSpy: jasmine.Spy;
  let collectionSpy: jasmine.Spy;
  let router: Router;
  let navigateSpy: jasmine.Spy;
  let toastrMock: jasmine.SpyObj<ToastrService>;

  async function createComponentWithToken(
    token: string | null
  ): Promise<void> {
    usersConfirmSpy = jasmine
      .createSpy('confirmPasswordReset')
      .and.returnValue(Promise.resolve(true));
    superusersConfirmSpy = jasmine
      .createSpy('confirmPasswordReset')
      .and.returnValue(Promise.resolve(true));
    collectionSpy = jasmine
      .createSpy('collection')
      .and.callFake((name: string) => {
        if (name === 'users') return { confirmPasswordReset: usersConfirmSpy };
        if (name === '_superusers')
          return { confirmPasswordReset: superusersConfirmSpy };
        return {};
      });
    toastrMock = jasmine.createSpyObj<ToastrService>('ToastrService', ['success']);

    await TestBed.configureTestingModule({
      imports: [WachtwoordResetComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: new Map(token ? [['token', token]] : []) },
          },
        },
        {
          provide: PocketbaseService,
          useValue: { client: { collection: collectionSpy } },
        },
        {
          provide: SeoService,
          useValue: jasmine.createSpyObj('SeoService', ['update']),
        },
        { provide: ToastrService, useValue: toastrMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    fixture = TestBed.createComponent(WachtwoordResetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create and read token from query params', async () => {
    await createComponentWithToken('abc123');
    expect(component).toBeTruthy();
    expect(component.tokenMissing()).toBeFalse();
  });

  it('should set tokenMissing when no token is present', async () => {
    await createComponentWithToken(null);
    expect(component.tokenMissing()).toBeTrue();
  });

  it('should not confirm when form is invalid', async () => {
    await createComponentWithToken('abc123');
    component.resetModel.set({ password: '', passwordConfirm: '' });
    await component.resetWachtwoord();
    expect(collectionSpy).not.toHaveBeenCalled();
  });

  it('should confirm reset and navigate to login on success', async () => {
    await createComponentWithToken('abc123');
    component.resetModel.set({
      password: 'nieuw-wachtwoord',
      passwordConfirm: 'nieuw-wachtwoord',
    });

    await component.resetWachtwoord();

    expect(usersConfirmSpy).toHaveBeenCalledWith(
      'abc123',
      'nieuw-wachtwoord',
      'nieuw-wachtwoord'
    );
    expect(toastrMock.success).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(component.resetError()).toBeNull();
  });

  it('should fall back to _superusers when users confirm fails', async () => {
    await createComponentWithToken('abc123');
    usersConfirmSpy.and.returnValue(Promise.reject(new Error('invalid token')));
    component.resetModel.set({
      password: 'nieuw-wachtwoord',
      passwordConfirm: 'nieuw-wachtwoord',
    });

    await component.resetWachtwoord();

    expect(superusersConfirmSpy).toHaveBeenCalledWith(
      'abc123',
      'nieuw-wachtwoord',
      'nieuw-wachtwoord'
    );
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should show error and not navigate when token is invalid everywhere', async () => {
    await createComponentWithToken('verlopen-token');
    usersConfirmSpy.and.returnValue(Promise.reject(new Error('invalid')));
    superusersConfirmSpy.and.returnValue(Promise.reject(new Error('invalid')));
    component.resetModel.set({
      password: 'nieuw-wachtwoord',
      passwordConfirm: 'nieuw-wachtwoord',
    });

    await component.resetWachtwoord();

    expect(component.resetError()).toContain('ongeldig of verlopen');
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
