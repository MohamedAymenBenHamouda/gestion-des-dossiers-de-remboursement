import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, NavItem } from '../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar [navItems]="navItems" />
      <main class="main-content">
        <div class="page-container">
          <router-outlet />
        </div>
      </main>
    </div>
  `
})
export class AdminLayoutComponent {
  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: '📊', route: '/admin/dashboard' },
    {
      label: 'Dossiers', icon: '📁', route: '/admin/dossiers',
      children: [
        { label: 'Tous les dossiers', icon: '🗂️', route: '/admin/dossiers' },
        { label: 'Brouillon',  icon: '✏️', route: '/admin/dossiers', queryParams: { statut: 'BROUILLON' } },
        { label: 'Soumis',     icon: '📤', route: '/admin/dossiers', queryParams: { statut: 'SOUMIS' } },
        { label: 'En cours',   icon: '⚙️', route: '/admin/dossiers', queryParams: { statut: 'EN_COURS' } },
        { label: 'Incomplet',  icon: '⚠️', route: '/admin/dossiers', queryParams: { statut: 'INCOMPLET' } },
        { label: 'Approuvé',   icon: '✅', route: '/admin/dossiers', queryParams: { statut: 'APPROUVE' } },
        { label: 'Rejeté',     icon: '❌', route: '/admin/dossiers', queryParams: { statut: 'REJETE' } },
      ]
    },
    { label: 'Agents',      icon: '🧑‍💼', route: '/admin/utilisateurs', queryParams: { role: 'ROLE_AGENT' } },
    { label: 'Assurés',     icon: '🧑‍⚕️', route: '/admin/utilisateurs', queryParams: { role: 'ROLE_ASSURE' } },
    { label: 'Déconnexion', icon: '🚪', route: '', isLogout: true },
  ];
}
