import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
export interface NavItem {
  label: string;
  icon: string;
  route: string;
  queryParams?: Record<string, string>;
  isLogout?: boolean;
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">🏥</div>
        <div class="sidebar-brand">
          <div class="brand-name">MedRembours</div>
          <div class="brand-role">{{ getRoleLabel() }}</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-label">Navigation</div>

          @for (item of regularItems; track item.label) {

            <!-- Item simple sans enfants -->
            @if (!item.children || item.children.length === 0) {
              <a [routerLink]="item.route"
                 [queryParams]="item.queryParams || {}"
                 routerLinkActive="active"
                 [routerLinkActiveOptions]="{ exact: !item.queryParams }"
                 class="nav-item">
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-label">{{ item.label }}</span>
              </a>

            <!-- Item avec sous-menu -->
            } @else {
              <div class="nav-group">
                <div class="nav-item nav-item-parent"
                     [class.expanded]="isExpanded(item)"
                     (click)="toggleExpand(item)">
                  <span class="nav-icon">{{ item.icon }}</span>
                  <span class="nav-label">{{ item.label }}</span>
                  <span class="nav-arrow" [class.open]="isExpanded(item)">›</span>
                </div>

                @if (isExpanded(item)) {
                  <div class="nav-children">
                    @for (child of item.children; track child.label) {
                      <a [routerLink]="child.route"
                         [queryParams]="child.queryParams || {}"
                         routerLinkActive="active-child"
                         [routerLinkActiveOptions]="{ exact: !child.queryParams }"
                         class="nav-child-item">
                        <span class="child-dot"></span>
                        <span class="child-icon">{{ child.icon }}</span>
                        <span class="nav-label">{{ child.label }}</span>
                      </a>
                    }
                  </div>
                }
              </div>
            }
          }
        </div>

        <!-- Séparateur avant déconnexion -->
        @if (logoutItem) {
          <div class="nav-divider"></div>
          <div class="nav-section">
            <button class="nav-item nav-logout-btn" (click)="authService.logout()">
              <span class="nav-icon">🚪</span>
              <span class="nav-label">Déconnexion</span>
            </button>
          </div>
        }
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ getUserInitials() }}</div>
          <div class="user-details">
            <div class="user-name">{{ getUserName() }}</div>
            <div class="user-email">{{ authService.currentUser()?.email }}</div>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar { position:fixed; left:0; top:0; bottom:0; width:var(--sidebar-width); background:var(--sidebar-bg); display:flex; flex-direction:column; z-index:100; border-right:1px solid rgba(255,255,255,0.05); }
    .sidebar-header { padding:20px; display:flex; align-items:center; gap:12px; border-bottom:1px solid rgba(255,255,255,0.06); }
    .sidebar-logo { font-size:1.75rem; width:44px; height:44px; background:rgba(26,86,219,0.2); border-radius:10px; display:flex; align-items:center; justify-content:center; }
    .brand-name { font-family:'Fraunces',Georgia,serif; font-size:1.1rem; font-weight:600; color:white; letter-spacing:-0.01em; }
    .brand-role { font-size:0.72rem; color:var(--sidebar-text); font-weight:500; margin-top:1px; text-transform:uppercase; letter-spacing:0.08em; }

    .sidebar-nav { flex:1; overflow-y:auto; padding:16px 12px; display:flex; flex-direction:column; }
    .nav-section-label { font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:rgba(148,163,184,0.5); padding:0 10px; margin-bottom:6px; }

    .nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:var(--radius); color:var(--sidebar-text); text-decoration:none; font-size:0.875rem; font-weight:500; transition:all 0.15s; margin-bottom:2px; }
    .nav-item:hover { background:rgba(255,255,255,0.06); color:white; }
    .nav-item.active { background:rgba(26,86,219,0.25); color:#6aa3f8; }
    .nav-item-parent { cursor:pointer; user-select:none; }
    .nav-arrow { margin-left:auto; font-size:1rem; transition:transform 0.2s; display:inline-block; line-height:1; }
    .nav-arrow.open { transform:rotate(90deg); }
    .nav-group { margin-bottom:2px; }
    .nav-children { padding-left:8px; margin-top:2px; border-left:2px solid rgba(255,255,255,0.06); margin-left:18px; }
    .nav-child-item { display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:var(--radius-sm); color:var(--sidebar-text); text-decoration:none; font-size:0.82rem; font-weight:500; transition:all 0.15s; margin-bottom:1px; }
    .nav-child-item:hover { background:rgba(255,255,255,0.05); color:white; }
    .nav-child-item.active-child { color:#6aa3f8; background:rgba(26,86,219,0.15); }
    .child-dot { width:5px; height:5px; border-radius:50%; background:currentColor; opacity:0.5; flex-shrink:0; }
    .child-icon { font-size:0.85rem; }
    .nav-icon { font-size:1.1rem; width:22px; text-align:center; }

    /* Divider */
    .nav-divider { height:1px; background:rgba(255,255,255,0.07); margin:10px 12px; }

    /* Bouton déconnexion */
    .nav-logout-btn {
      width:100%; background:none; border:none; cursor:pointer; font-family:var(--font-sans);
      text-align:left;
      &:hover { background:rgba(239,68,68,0.12) !important; color:#f87171 !important; }
    }

    /* Footer */
    .sidebar-footer { padding:14px 16px; border-top:1px solid rgba(255,255,255,0.06); }
    .user-info { display:flex; align-items:center; gap:10px; min-width:0; }
    .user-avatar { width:36px; height:36px; background:linear-gradient(135deg,var(--primary),var(--accent)); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; color:white; flex-shrink:0; }
    .user-details { min-width:0; }
    .user-name { font-size:0.8rem; font-weight:600; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .user-email { font-size:0.7rem; color:var(--sidebar-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  `]
})
export class SidebarComponent {
  @Input() navItems: NavItem[] = [];
  expandedItems = new Set<string>();

  constructor(public authService: AuthService) {}

  get regularItems(): NavItem[] {
    return this.navItems.filter(i => !i.isLogout);
  }

  get logoutItem(): NavItem | undefined {
    return this.navItems.find(i => i.isLogout);
  }

  toggleExpand(item: NavItem) {
    if (this.expandedItems.has(item.label)) {
      this.expandedItems.delete(item.label);
    } else {
      this.expandedItems.add(item.label);
    }
  }

  isExpanded(item: NavItem): boolean {
    return this.expandedItems.has(item.label);
  }

  getUserName(): string {
    const user = this.authService.currentUser();
    return user ? `${user.prenom} ${user.nom}` : '';
  }

  getUserInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return '?';
    return `${user.prenom[0]}${user.nom[0]}`.toUpperCase();
  }

  getRoleLabel(): string {
    const role = this.authService.getRole();
    const labels: Record<string, string> = {
      'ROLE_ADMIN': 'Administrateur',
      'ROLE_AGENT': 'Agent de traitement',
      'ROLE_ASSURE': 'Espace assuré'
    };
    return labels[role ?? ''] ?? '';
  }
}
