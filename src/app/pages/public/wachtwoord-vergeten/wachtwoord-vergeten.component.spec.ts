import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PocketbaseService } from '../../../shared/services/pocketbase.service';
import { SeoService } from '../../../shared/services/seo.service';
import { WachtwoordVergetenComponent } from './wachtwoord-vergeten.component';

describe('WachtwoordVergetenComponent', () => {
  let component: WachtwoordVergetenComponent;
  let fixture: ComponentFixture<WachtwoordVergetenComponent>;
  let usersResetSpy: jasmine.Spy;
  let superusersResetSpy: jasmine.Spy;
  let collectionSpy: jasmine.Spy;

  beforeEach(async () => {
    usersResetSpy = jasmine
      .createSpy('requestPasswordReset')
      .and.returnValue(Promise.resolve(true));
    superusersResetSpy = jasmine
      .createSpy('requestPasswordReset')
      .and.returnValue(Promise.resolve(true));
    collectionSpy = jasmine
      .createSpy('collection')
      .and.callFake((name: string) => {
        if (name === 'users') return { requestPasswordReset: usersResetSpy };
        if (name === '_superusers')
          return { requestPasswordReset: superusersResetSpy };
        return {};
      });

    await TestBed.configureTestingModule({
      imports: [WachtwoordVergetenComponent],
      providers: [
        provideRouter([]),
        {
          provide: PocketbaseService,
          useValue: { client: { collection: collectionSpy } },
        },
        {
          provide: SeoService,
          useValue: jasmine.createSpyObj('SeoService', ['update']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WachtwoordVergetenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not request reset when form is invalid', async () => {
    component.wachtwoordVergetenModel.set({ email: '' });
    await component.verstuurResetMail();
    expect(collectionSpy).not.toHaveBeenCalled();
  });

  it('should request reset on users and _superusers and show generic success', async () => {
    component.wachtwoordVergetenModel.set({ email: 'test@example.com' });

    await component.verstuurResetMail();

    expect(collectionSpy).toHaveBeenCalledWith('users');
    expect(collectionSpy).toHaveBeenCalledWith('_superusers');
    expect(usersResetSpy).toHaveBeenCalledWith('test@example.com');
    expect(superusersResetSpy).toHaveBeenCalledWith('test@example.com');
    expect(component.emailVerzonden()).toBeTrue();
    expect(component.errorMessage()).toBeNull();
  });

  it('should still show generic success when both collections fail (no account leak)', async () => {
    usersResetSpy.and.returnValue(Promise.reject(new Error('fail')));
    superusersResetSpy.and.returnValue(Promise.reject(new Error('fail')));
    component.wachtwoordVergetenModel.set({ email: 'onbekend@example.com' });

    await component.verstuurResetMail();

    expect(component.emailVerzonden()).toBeTrue();
    expect(component.errorMessage()).toBeNull();
  });
});
