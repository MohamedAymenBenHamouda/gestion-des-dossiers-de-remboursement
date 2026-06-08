import { Routes } from '@angular/router';
import { AssureLayoutComponent } from './assure-layout.component';

export const assureRoutes: Routes = [
  {
    path: '',
    component: AssureLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/assure-dashboard.component')
            .then(m => m.AssureDashboardComponent)
      },
      {
        path: 'dossiers',
        loadComponent: () =>
          import('./dossiers/assure-dossiers.component')
            .then(m => m.AssureDossiersComponent)
      },
      {
        path: 'dossiers/:id',
        loadComponent: () =>
          import('./dossier-detail/dossier-detail.component')
            .then(m => m.DossierDetailComponent)
      },
      {
        path: 'historique',
        loadComponent: () =>
          import('./historique/historique-remboursement.component')
            .then(m => m.HistoriqueRemboursementComponent)
      },
      {
        path: 'profil',
        loadComponent: () =>
          import('./profil/assure-profil.component')
            .then(m => m.AssureProfilComponent)
      },
      {
        path: 'chatbot',
        loadComponent: () =>
          import('./chatbot/chatbot.component')
            .then(m => m.ChatbotComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
