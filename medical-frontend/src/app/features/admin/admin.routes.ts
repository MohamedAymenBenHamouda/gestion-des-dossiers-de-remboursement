import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'dossiers', loadComponent: () => import('./dossiers/admin-dossiers.component').then(m => m.AdminDossiersComponent) },
      { path: 'utilisateurs', loadComponent: () => import('./utilisateurs/admin-utilisateurs.component').then(m => m.AdminUtilisateursComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
