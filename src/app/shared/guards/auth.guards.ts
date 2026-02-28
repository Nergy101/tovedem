import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';

export function globalAdminGuard(): CanActivateFn {
  return () => {
    const router = inject(Router);
    const toastr = inject(ToastrService);
    const authService = inject(AuthService);

    if (authService.isGlobalAdmin) {
      return true;
    }

    toastr.error('Deze pagina is alleen toegankelijk voor global admins');
    return router.createUrlTree(['/']);
  };
}

export function loggedInGuard(requiredRoles: string[] = []): CanActivateFn {
  return () => {
    const router = inject(Router);
    const toastr = inject(ToastrService);
    const authService = inject(AuthService);

    if (authService.isGlobalAdmin) {
      return true;
    }

    if (requiredRoles.length === 0 && authService.isLoggedIn()) {
      return true;
    }
    if (requiredRoles.length > 0 && authService.isLoggedIn()) {
      if (authService.userHasAnyRole(requiredRoles)) {
        return true;
      }
    }

    toastr.error('Deze pagina bestaat niet');
    return router.createUrlTree([]);
  };
}
