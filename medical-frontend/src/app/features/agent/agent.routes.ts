import { Routes } from '@angular/router';
import { AgentLayoutComponent } from './agent-layout.component';

export const agentRoutes: Routes = [
  {
    path: '',
    component: AgentLayoutComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./dashboard/agent-dashboard.component').then(m => m.AgentDashboardComponent) },
      { path: 'dossiers', loadComponent: () => import('./dossiers/agent-dossiers.component').then(m => m.AgentDossiersComponent) },
      { path: 'profil', loadComponent: () => import('./profil/agent-profil.component').then(m => m.AgentProfilComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
