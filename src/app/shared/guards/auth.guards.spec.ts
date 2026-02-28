import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';
import { globalAdminGuard, loggedInGuard } from './auth.guards';

describe('auth.guards', () => {
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;
  let toastrMock: jasmine.SpyObj<ToastrService>;
  const fakeUrlTree = {} as UrlTree;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', [
      'userHasAnyRole',
      'isLoggedIn',
    ]);
    (authServiceMock.isLoggedIn as jasmine.Spy).and.returnValue(false);
    Object.defineProperty(authServiceMock, 'isGlobalAdmin', {
      get: () => false,
      configurable: true,
    });

    routerMock = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    routerMock.createUrlTree.and.returnValue(fakeUrlTree);

    toastrMock = jasmine.createSpyObj<ToastrService>('ToastrService', ['error']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ToastrService, useValue: toastrMock },
      ],
    });
  });

  describe('globalAdminGuard', () => {
    it('should allow access when user is global admin', () => {
      Object.defineProperty(authServiceMock, 'isGlobalAdmin', {
        get: () => true,
        configurable: true,
      });

      const result = TestBed.runInInjectionContext(() => {
        const fn = globalAdminGuard();
        return fn(null as any, null as any);
      });

      expect(result).toBe(true);
      expect(toastrMock.error).not.toHaveBeenCalled();
      expect(routerMock.createUrlTree).not.toHaveBeenCalled();
    });

    it('should redirect and show toast when user is not global admin', () => {
      Object.defineProperty(authServiceMock, 'isGlobalAdmin', {
        get: () => false,
        configurable: true,
      });

      const result = TestBed.runInInjectionContext(() => {
        const fn = globalAdminGuard();
        return fn(null as any, null as any);
      });

      expect(result).toBe(fakeUrlTree);
      expect(toastrMock.error).toHaveBeenCalledWith(
        'Deze pagina is alleen toegankelijk voor global admins'
      );
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/']);
    });
  });

  describe('loggedInGuard', () => {
    beforeEach(() => {
      (authServiceMock.isLoggedIn as jasmine.Spy).and.returnValue(false);
      authServiceMock.userHasAnyRole.and.returnValue(false);
    });

    it('should allow access when user is global admin', () => {
      Object.defineProperty(authServiceMock, 'isGlobalAdmin', {
        get: () => true,
        configurable: true,
      });

      const result = TestBed.runInInjectionContext(() => {
        const fn = loggedInGuard(['admin']);
        return fn(null as any, null as any);
      });

      expect(result).toBe(true);
      expect(toastrMock.error).not.toHaveBeenCalled();
    });

    it('should allow access when requiredRoles is empty and user is logged in', () => {
      Object.defineProperty(authServiceMock, 'isGlobalAdmin', {
        get: () => false,
        configurable: true,
      });
      (authServiceMock.isLoggedIn as jasmine.Spy).and.returnValue(true);

      const result = TestBed.runInInjectionContext(() => {
        const fn = loggedInGuard([]);
        return fn(null as any, null as any);
      });

      expect(result).toBe(true);
      expect(toastrMock.error).not.toHaveBeenCalled();
    });

    it('should allow access when user has one of the required roles', () => {
      Object.defineProperty(authServiceMock, 'isGlobalAdmin', {
        get: () => false,
        configurable: true,
      });
      (authServiceMock.isLoggedIn as jasmine.Spy).and.returnValue(true);
      authServiceMock.userHasAnyRole.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() => {
        const fn = loggedInGuard(['admin', 'bestuur']);
        return fn(null as any, null as any);
      });

      expect(result).toBe(true);
      expect(authServiceMock.userHasAnyRole).toHaveBeenCalledWith([
        'admin',
        'bestuur',
      ]);
      expect(toastrMock.error).not.toHaveBeenCalled();
    });

    it('should redirect and show toast when user is not logged in', () => {
      Object.defineProperty(authServiceMock, 'isGlobalAdmin', {
        get: () => false,
        configurable: true,
      });
      (authServiceMock.isLoggedIn as jasmine.Spy).and.returnValue(false);

      const result = TestBed.runInInjectionContext(() => {
        const fn = loggedInGuard(['admin']);
        return fn(null as any, null as any);
      });

      expect(result).toBe(fakeUrlTree);
      expect(toastrMock.error).toHaveBeenCalledWith('Deze pagina bestaat niet');
      expect(routerMock.createUrlTree).toHaveBeenCalledWith([]);
    });

    it('should redirect and show toast when user is logged in but lacks required role', () => {
      Object.defineProperty(authServiceMock, 'isGlobalAdmin', {
        get: () => false,
        configurable: true,
      });
      (authServiceMock.isLoggedIn as jasmine.Spy).and.returnValue(true);
      authServiceMock.userHasAnyRole.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() => {
        const fn = loggedInGuard(['admin']);
        return fn(null as any, null as any);
      });

      expect(result).toBe(fakeUrlTree);
      expect(toastrMock.error).toHaveBeenCalledWith('Deze pagina bestaat niet');
      expect(routerMock.createUrlTree).toHaveBeenCalledWith([]);
    });
  });
});
