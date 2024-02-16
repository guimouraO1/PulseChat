import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    // canActivate: [],
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
];
