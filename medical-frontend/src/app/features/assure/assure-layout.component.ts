import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, NavItem } from '../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-assure-layout',
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
export class AssureLayoutComponent {
  navItems: NavItem[] = [
    { label: 'Mon espace',   icon: '🏠', route: '/assure/dashboard' },
    { label: 'Mes dossiers', icon: '📁', route: '/assure/dossiers'  },
    { label: 'Historique',   icon: '💰', route: '/assure/historique'},
    { label: 'Assistant ',   icon: '🤖', route: '/assure/chatbot'   },
    { label: 'Mon profil',   icon: '👤', route: '/assure/profil'    },
    { label: 'Déconnexion',  icon: '🚪', route: '', isLogout: true  },
  ];
}
