import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/models/models';

@Component({
  selector: 'app-admin-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{ filter === 'ROLE_AGENT' ? '🧑‍💼 Agents' : filter === 'ROLE_ASSURE' ? '🧑‍⚕️ Assurés' : 'Utilisateurs' }}
        </h1>
        <p class="page-subtitle">{{ filteredUsers().length }} compte(s) · Gérez les accès</p>
      </div>
      <button class="btn btn-primary" (click)="openModal()">+ Nouvel utilisateur</button>
    </div>

    <!-- Filtres -->
    <div class="card" style="margin-bottom: 20px;">
      <div class="card-body" style="padding: 16px 20px;">
        <div style="display:flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          
          <input
            class="form-control"
            style="max-width: 260px; margin-left: left;"
            placeholder="🔍 Rechercher..."
            [(ngModel)]="search"
          />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>CIN</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (u of filteredUsers(); track u.id) {
              <tr>
                <td>
                  <div style="display:flex; align-items: center; gap:10px;">
                    <div class="mini-avatar" [style.background]="getAvatarColor(u.role)">
                      {{ u.prenom[0] }}{{ u.nom[0] }}
                    </div>
                    <div>
                      <div style="font-weight: 600; color: var(--gray-900);">{{ u.prenom }} {{ u.nom }}</div>
                      <div style="font-size:0.75rem; color: var(--gray-400);">{{ u.telephone || '-' }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ u.email }}</td>
                <td>{{ u.cin || '-' }}</td>
                <td>
                  <span [class]="getRoleBadge(u.role)">{{ getRoleLabel(u.role) }}</span>
                </td>
                <td>
                  <span [class]="u.actif ? 'badge badge-success' : 'badge badge-danger'">
                    {{ u.actif ? 'Actif' : 'Désactivé' }}
                  </span>
                </td>
                <td>{{ formatDate(u.createdAt) }}</td>
                <td>
                  <div style="display:flex; gap: 6px; align-items: center;">
                    <button class="btn btn-sm btn-secondary" title="Modifier" (click)="editUser(u)">✏️ Modifier</button>
                    <button
                      class="btn btn-sm"
                      [class]="u.actif ? 'btn-warning' : 'btn-success'"
                      [title]="u.actif ? 'Désactiver' : 'Activer'"
                      (click)="toggleActif(u)"
                    >{{ u.actif ? '🔒 Désactiver' : '🔓 Activer' }}</button>
                    <button
                      class="btn btn-sm btn-danger"
                      title="Supprimer"
                      (click)="confirmDelete(u)"
                    >🗑️ Supprimer</button>
                  </div>
                </td>
              </tr>
            }
            @if (filteredUsers().length === 0) {
              <tr>
                <td colspan="7">
                  <div class="empty-state" style="padding: 30px;">
                    <div class="empty-icon">👥</div>
                    <h3>Aucun utilisateur trouvé</h3>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    @if (showModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <span class="modal-title">{{ editingUser ? 'Modifier utilisateur' : 'Nouvel utilisateur' }}</span>
            <button class="btn btn-icon btn-secondary" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            @if (modalError) { <div class="alert alert-danger">{{ modalError }}</div> }
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Nom *</label>
                <input class="form-control" [(ngModel)]="form.nom" placeholder="Nom" />
              </div>
              <div class="form-group">
                <label class="form-label">Prénom *</label>
                <input class="form-control" [(ngModel)]="form.prenom" placeholder="Prénom" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input type="email" class="form-control" [(ngModel)]="form.email" placeholder="email@exemple.com" />
            </div>
            <div class="form-group">
              <label class="form-label">{{ editingUser ? 'Nouveau mot de passe (laisser vide = inchangé)' : 'Mot de passe *' }}</label>
              <input type="password" class="form-control" [(ngModel)]="form.password" placeholder="au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial" />
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Rôle *</label>
                <select class="form-control" [(ngModel)]="form.role">
                  <option value="ROLE_AGENT">Agent</option>
                  <option value="ROLE_ASSURE">Assuré</option>
                  <option value="ROLE_ADMIN">Admin</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">CIN</label>
                <input class="form-control" [(ngModel)]="form.cin" placeholder="12345678" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Téléphone</label>
              <input class="form-control" [(ngModel)]="form.telephone" placeholder="22334455" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Annuler</button>
            <button class="btn btn-primary" (click)="saveUser()" [disabled]="saving">
              {{ saving ? 'Enregistrement...' : (editingUser ? 'Modifier' : 'Créer') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal Confirmation Suppression -->
    @if (showDeleteModal) {
      <div class="modal-overlay" (click)="cancelDelete()">
        <div class="modal" style="max-width: 420px;" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <span class="modal-title">⚠️ Confirmer la suppression</span>
            <button class="btn btn-icon btn-secondary" (click)="cancelDelete()">✕</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <p style="color: var(--gray-700); margin: 0;">
              Voulez-vous vraiment supprimer le compte de
              <strong>{{ userToDelete?.prenom }} {{ userToDelete?.nom }}</strong> ?
              <br><br>
              <span style="color: var(--danger, #dc2626); font-size: 0.875rem;">⚠️ Cette action est irréversible.</span>
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="cancelDelete()">Annuler</button>
            <button class="btn btn-danger" (click)="deleteUser()" [disabled]="deleting">
              {{ deleting ? 'Suppression...' : '🗑️ Supprimer définitivement' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .filter-tabs {
      display: flex;
      background: var(--gray-100);
      border-radius: var(--radius-sm);
      padding: 3px;

      button {
        padding: 7px 14px;
        border: none;
        background: none;
        border-radius: var(--radius-sm);
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--gray-600);
        cursor: pointer;
        transition: all 0.15s;
        font-family: var(--font-sans);

        &.active {
          background: white;
          color: var(--gray-900);
          box-shadow: var(--shadow-sm);
        }
      }
    }

    .mini-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
      border: none;
      &:hover { background: #b91c1c; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  `]
})
export class AdminUtilisateursComponent implements OnInit {
  users: User[] = [];
  filter = 'all';
  search = '';
  showModal = false;
  editingUser: User | null = null;
  saving = false;
  modalError = '';

  showDeleteModal = false;
  userToDelete: User | null = null;
  deleting = false;

  form = { nom: '', prenom: '', email: '', password: '', role: 'ROLE_ASSURE', cin: '', telephone: '', adresse: '' };

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.load();
    // Lire le queryParam "role" depuis la sidebar (Agents / Assurés)
    this.route.queryParams.subscribe(params => {
      if (params['role']) {
        this.filter = params['role'];
      } else {
        this.filter = 'all';
      }
    });
  }

  load() {
    this.api.getTousUtilisateurs().subscribe(data => this.users = data);
  }

  filteredUsers(): User[] {
    return this.users.filter(u => {
      const matchRole = this.filter === 'all' || u.role === this.filter;
      const q = this.search.toLowerCase();
      const matchSearch = !q || u.nom.toLowerCase().includes(q) || u.prenom.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }

  setFilter(f: string) { this.filter = f; }

  openModal() {
    this.editingUser = null;
    this.form = { nom: '', prenom: '', email: '', password: '', role: 'ROLE_ASSURE', cin: '', telephone: '', adresse: '' };
    this.modalError = '';
    this.showModal = true;
  }

  editUser(u: User) {
    this.editingUser = u;
    this.form = { nom: u.nom, prenom: u.prenom, email: u.email, password: '', role: u.role, cin: u.cin || '', telephone: u.telephone || '', adresse: u.adresse || '' };
    this.modalError = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  saveUser() {
    this.saving = true;
    this.modalError = '';
    const obs = this.editingUser
      ? this.api.mettreAJourUtilisateur(this.editingUser.id, this.form)
      : this.api.creerUtilisateur(this.form);

    obs.subscribe({
      next: () => { this.saving = false; this.closeModal(); this.load(); },
      error: (err) => { this.saving = false; this.modalError = err.error?.message || 'Erreur.'; }
    });
  }

  toggleActif(u: User) {
    const obs = u.actif ? this.api.desactiverUtilisateur(u.id) : this.api.activerUtilisateur(u.id);
    obs.subscribe(() => this.load());
  }

  confirmDelete(u: User) {
    this.userToDelete = u;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.userToDelete = null;
    this.showDeleteModal = false;
    this.deleting = false;
  }

  deleteUser() {
    if (!this.userToDelete) return;
    this.deleting = true;
    this.api.supprimerUtilisateur(this.userToDelete.id).subscribe({
      next: () => { this.deleting = false; this.cancelDelete(); this.load(); },
      error: () => { this.deleting = false; }
    });
  }

  getRoleLabel(role: string): string {
    return { ROLE_ADMIN: 'Admin', ROLE_AGENT: 'Agent', ROLE_ASSURE: 'Assuré' }[role] ?? role;
  }

  getRoleBadge(role: string): string {
    return { ROLE_ADMIN: 'badge badge-danger', ROLE_AGENT: 'badge badge-info', ROLE_ASSURE: 'badge badge-primary' }[role] ?? 'badge badge-gray';
  }

  getAvatarColor(role: string): string {
    return { ROLE_ADMIN: '#dc2626', ROLE_AGENT: '#3b82f6', ROLE_ASSURE: '#10b981' }[role] ?? '#9ca3af';
  }

  formatDate(date?: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
