import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

export const authGuard: CanActivateFn = async (route, state) => {
  
  const _authService: AuthService = inject(AuthService);
  const router = inject(Router);
  const userService = inject(UserService);
  const result = await _authService._isAuthUser();
  const user = await _authService.getUser();
  
  userService.changeUser(user);

  if(result){
    return result;
  }
 
  return router.createUrlTree(['login']);
};

export const alwaysAllowAuthGuard: CanActivateFn = async (route, state) => {
  
  const _authService: AuthService = inject(AuthService);
  
  await _authService._isAuthUser();
  return true;
};
