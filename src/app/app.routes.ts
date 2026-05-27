import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'board' },
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Entrar · Kanban Manager',
    loadComponent: () => import('./login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'board',
    canActivate: [authGuard],
    title: 'Sprint Board · Kanban Manager',
    loadComponent: () => import('./board/board-page').then((m) => m.BoardPageComponent),
  },
  { path: '**', redirectTo: 'board' },
];
