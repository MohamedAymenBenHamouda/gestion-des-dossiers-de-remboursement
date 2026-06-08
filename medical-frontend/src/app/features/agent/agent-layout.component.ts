import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, NavItem } from '../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-agent-layout',
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
export class AgentLayoutComponent {
  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: '📊', route: '/agent/dashboard' },
    { label: 'Dossiers',        icon: '📁', route: '/agent/dossiers' },
    { label: 'Mon profil',      icon: '🏢', route: '/agent/profil' },
    { label: 'Déconnexion',     icon: '🚪', route: '', isLogout: true },
  ];
}
