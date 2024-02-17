import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  
  const _authService: AuthService = inject(AuthService);
  const router = inject(Router);
  const result = await _authService._isAuthUser();
  if(result){
    return result;
  }
 
  return router.createUrlTree(['login']);
};

export const alwaysAllowAuthGuard: CanActivateFn = async (route, state) => {
  
  const _authService: AuthService = inject(AuthService);
  
  const result = await _authService._isAuthUser();
  return true;
};
