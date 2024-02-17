import { Routes } from '@angular/router';
import { alwaysAllowAuthGuard, authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [alwaysAllowAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        title: 'PulseChat | Login',
        loadComponent: () =>
          import('./pages/login/login.component').then((p) => p.LoginComponent),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'chat',
        title: 'PulseChat | Chat',
        loadComponent: () =>
          import('./pages/chat/chat.component').then((p) => p.ChatComponent),
      },
    ],
  },
  {
    path: '**',
    title: 'PulseChat | 404',
    canActivate: [alwaysAllowAuthGuard],
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (p) => p.NotFoundComponent
      ),
  },
];
