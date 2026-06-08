import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] },
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
  },
  {
    path: 'agent',
    canActivate: [authGuard],
    data: { roles: ['ROLE_AGENT', 'ROLE_ADMIN'] },
    loadChildren: () => import('./features/agent/agent.routes').then(m => m.agentRoutes)
  },
  {
    path: 'assure',
    canActivate: [authGuard],
    data: { roles: ['ROLE_ASSURE'] },
    loadChildren: () => import('./features/assure/assure.routes').then(m => m.assureRoutes)
  },
  { path: '**', redirectTo: '/auth/login' }
];
