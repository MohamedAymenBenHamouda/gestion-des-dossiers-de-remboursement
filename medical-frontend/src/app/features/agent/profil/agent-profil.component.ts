import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/models/models';
import { environment } from '../../../../environments/environment';

type ActiveTab = 'infos' | 'securite' | 'activite';

@Component({
  selector: 'app-agent-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profil-page">

      <!-- En-tête profil -->
      <div class="profil-header">
        <div class="avatar-large">{{ initiales }}</div>
        <div class="header-info">
          <h1>{{ user?.prenom }} {{ user?.nom }}</h1>
          <p class="header-role">
            <span class="badge-role">🏢 Agent de traitement</span>
            <span class="header-email">{{ user?.email }}</span>
          </p>
          <p class="header-date">Membre depuis {{ user?.createdAt | date:'MMMM yyyy' : '' : 'fr' }}</p>
        </div>
        <div class="header-kpi">
          <div class="kpi-item">
            <div class="kpi-value">{{ totalTraites }}</div>
            <div class="kpi-label">Dossiers traités</div>
          </div>
          <div class="kpi-sep"></div>
          <div class="kpi-item">
            <div class="kpi-value">{{ totalEnCours }}</div>
            <div class="kpi-label">En cours</div>
          </div>
        </div>
      </div>

      <!-- Onglets -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'infos'" (click)="activeTab = 'infos'">
          📋 Mes informations
        </button>
        <button class="tab" [class.active]="activeTab === 'securite'" (click)="activeTab = 'securite'">
          🔒 Sécurité
        </button>
        <button class="tab" [class.active]="activeTab === 'activite'" (click)="activeTab = 'activite'">
          📊 Mon activité
          @if (totalTraites > 0) {
            <span class="tab-badge">{{ totalTraites }}</span>
          }
        </button>
      </div>

      <!-- ===== ONGLET : Mes informations ===== -->
      @if (activeTab === 'infos') {
        <div class="tab-content">
          @if (successMsg) { <div class="alert alert-success">✅ {{ successMsg }}</div> }
          @if (errorMsg) { <div class="alert alert-danger">⚠️ {{ errorMsg }}</div> }

          <div class="card">
            <div class="card-header">
              <h3>Informations personnelles</h3>
              @if (!editMode) {
                <button class="btn btn-outline btn-sm" (click)="startEdit()">✏️ Modifier</button>
              }
            </div>

            @if (!editMode) {
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Prénom</span>
                  <span class="info-value">{{ user?.prenom }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Nom</span>
                  <span class="info-value">{{ user?.nom }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email</span>
                  <span class="info-value">{{ user?.email }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Téléphone</span>
                  <span class="info-value">{{ user?.telephone || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">CIN</span>
                  <span class="info-value">{{ user?.cin || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Rôle</span>
                  <span class="info-value">
                    <span class="role-tag">🏢 Agent de traitement</span>
                  </span>
                </div>
                <div class="info-item info-item-full">
                  <span class="info-label">Adresse</span>
                  <span class="info-value">{{ user?.adresse || '—' }}</span>
                </div>
              </div>
            } @else {
              <div class="edit-grid">
                <div class="form-group">
                  <label class="form-label">Prénom</label>
                  <input class="form-control" [(ngModel)]="editForm.prenom" />
                </div>
                <div class="form-group">
                  <label class="form-label">Nom</label>
                  <input class="form-control" [(ngModel)]="editForm.nom" />
                </div>
                <div class="form-group">
                  <label class="form-label">Téléphone</label>
                  <input class="form-control" [(ngModel)]="editForm.telephone" placeholder="22334455" />
                </div>
                <div class="form-group">
                  <label class="form-label">CIN</label>
                  <input class="form-control" [(ngModel)]="editForm.cin" />
                </div>
                <div class="form-group form-group-full">
                  <label class="form-label">Adresse</label>
                  <input class="form-control" [(ngModel)]="editForm.adresse" />
                </div>
              </div>
              <div class="edit-actions">
                <button class="btn btn-ghost" (click)="cancelEdit()">Annuler</button>
                <button class="btn btn-primary" (click)="sauvegarder()" [disabled]="saving">
                  @if (saving) { <span class="spinner"></span> }
                  Enregistrer
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- ===== ONGLET : Sécurité ===== -->
      @if (activeTab === 'securite') {
        <div class="tab-content">
          @if (successMsg) { <div class="alert alert-success">✅ {{ successMsg }}</div> }
          @if (errorMsg) { <div class="alert alert-danger">⚠️ {{ errorMsg }}</div> }

          <div class="card">
            <div class="card-header">
              <h3>Changer le mot de passe</h3>
            </div>
            <div class="form-stack">
              <div class="form-group">
                <label class="form-label">Mot de passe actuel</label>
                <div class="input-pass">
                  <input [type]="showOld ? 'text' : 'password'" class="form-control"
                    [(ngModel)]="passwordForm.ancien" placeholder="••••••••" />
                  <button type="button" class="eye-btn" (click)="showOld = !showOld">
                    {{ showOld ? '🙈' : '👁️' }}
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Nouveau mot de passe</label>
                <div class="input-pass">
                  <input [type]="showNew ? 'text' : 'password'" class="form-control"
                    [(ngModel)]="passwordForm.nouveau" placeholder="au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial" />
                  <button type="button" class="eye-btn" (click)="showNew = !showNew">
                    {{ showNew ? '🙈' : '👁️' }}
                  </button>
                </div>
                @if (passwordForm.nouveau) {
                  <div class="password-strength">
                    <div class="strength-bar">
                      <div class="strength-fill" [style.width]="strengthPct + '%'"
                        [class]="strengthClass"></div>
                    </div>
                    <span class="strength-label">{{ strengthLabel }}</span>
                  </div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Confirmer le nouveau mot de passe</label>
                <input [type]="showNew ? 'text' : 'password'" class="form-control"
                  [(ngModel)]="passwordForm.confirmer" placeholder="Répétez le mot de passe" />
                @if (passwordForm.confirmer && passwordForm.nouveau !== passwordForm.confirmer) {
                  <span class="form-error">Les mots de passe ne correspondent pas</span>
                }
              </div>
              <div class="edit-actions">
                <button class="btn btn-primary" (click)="changerMotDePasse()"
                  [disabled]="savingPass || !canChangePass()">
                  @if (savingPass) { <span class="spinner"></span> }
                  🔒 Changer le mot de passe
                </button>
              </div>
            </div>
          </div>

          <div class="card card-danger">
            <div class="danger-zone">
              <div>
                <p class="danger-title">Se déconnecter</p>
                <p class="danger-desc">Vous serez redirigé vers la page de connexion.</p>
              </div>
              <button class="btn btn-danger" (click)="authService.logout()">⬅️ Déconnexion</button>
            </div>
          </div>
        </div>
      }

      <!-- ===== ONGLET : Mon activité ===== -->
      @if (activeTab === 'activite') {
        <div class="tab-content">
          <div class="stats-row">
            @for (stat of statsCards; track stat.label) {
              <div class="stat-mini" [style.--color]="stat.color">
                <div class="stat-mini-icon">{{ stat.icon }}</div>
                <div class="stat-mini-val">{{ stat.value }}</div>
                <div class="stat-mini-label">{{ stat.label }}</div>
              </div>
            }
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Dossiers que je traite</h3>
            </div>
            @if (loadingDossiers) {
              <div class="loading-state">
                <div class="spinner-lg"></div><p>Chargement...</p>
              </div>
            } @else if (mesDossiers.length === 0) {
              <div class="empty-state">
                <div class="empty-icon">📂</div>
                <p>Aucun dossier assigné pour le moment</p>
              </div>
            } @else {
              <div class="dossiers-list">
                @for (d of mesDossiers; track d.id) {
                  <div class="dossier-row">
                    <div class="dossier-num">{{ d.numeroDossier }}</div>
                    <div class="dossier-info">
                      <div class="dossier-assure">
                        {{ d.assure?.prenom }} {{ d.assure?.nom }}
                      </div>
                      <div class="dossier-desc">{{ d.description }}</div>
                    </div>
                    <div class="dossier-date">{{ d.createdAt | date:'dd/MM/yyyy' }}</div>
                    <span class="badge" [class]="getStatutClass(d.statut)">
                      {{ getStatutLabel(d.statut) }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .profil-page { max-width: 900px; margin: 0 auto; }

    .profil-header {
      display: flex; align-items: center; gap: 24px;
      background: linear-gradient(135deg, #0f172a, #1e3a5f);
      border-radius: var(--radius-lg); padding: 32px; margin-bottom: 24px; color: white;
    }
    .avatar-large {
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; font-weight: 700; color: white; flex-shrink: 0;
      border: 3px solid rgba(255,255,255,0.2);
    }
    .header-info { flex: 1; }
    .header-info h1 { font-family: 'Fraunces', serif; font-size: 1.75rem; font-weight: 600; margin-bottom: 6px; }
    .header-role { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .badge-role { background: rgba(255,255,255,0.15); padding: 3px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
    .header-email { font-size: 0.875rem; opacity: 0.7; }
    .header-date { font-size: 0.8rem; opacity: 0.5; }

    .header-kpi { display: flex; align-items: center; gap: 20px; background: rgba(255,255,255,0.08); border-radius: var(--radius-md); padding: 16px 24px; }
    .kpi-item { text-align: center; }
    .kpi-value { font-size: 2rem; font-weight: 800; }
    .kpi-label { font-size: 0.72rem; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.06em; }
    .kpi-sep { width: 1px; height: 40px; background: rgba(255,255,255,0.2); }

    .tabs { display: flex; gap: 4px; margin-bottom: 20px; background: var(--gray-100); padding: 4px; border-radius: var(--radius-md); }
    .tab {
      flex: 1; padding: 10px 16px; border: none; background: none; border-radius: var(--radius);
      font-size: 0.875rem; font-weight: 600; color: var(--gray-500); cursor: pointer;
      font-family: var(--font-sans); transition: all 0.15s;
      &.active { background: white; color: var(--primary); box-shadow: var(--shadow-sm); }
    }
    .tab-badge { background: var(--primary); color: white; font-size: 0.65rem; font-weight: 700; padding: 1px 6px; border-radius: 10px; margin-left: 6px; }

    .card { background: white; border-radius: var(--radius-lg); border: 1px solid var(--gray-200); margin-bottom: 16px; overflow: hidden; }
    .card-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--gray-100);
      h3 { font-size: 1rem; font-weight: 700; color: var(--gray-900); margin: 0; }
    }
    .card-danger .card-header { background: #fff5f5; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; padding: 8px 0; }
    .info-item { padding: 16px 24px; border-bottom: 1px solid var(--gray-50);
      &.info-item-full { grid-column: 1 / -1; }
    }
    .info-label { display: block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gray-400); margin-bottom: 4px; }
    .info-value { font-size: 0.95rem; color: var(--gray-800); font-weight: 500; }
    .role-tag { background: #ede9fe; color: #6d28d9; padding: 3px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }

    .edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 20px 24px; }
    .form-group-full { grid-column: 1 / -1; }
    .edit-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--gray-100); background: var(--gray-50); }

    .form-stack { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
    .input-pass { position: relative;
      .form-control { padding-right: 44px; }
      .eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1rem; }
    }
    .form-error { font-size: 0.75rem; color: var(--danger); margin-top: 4px; display: block; }

    .password-strength { margin-top: 8px; display: flex; align-items: center; gap: 10px; }
    .strength-bar { flex: 1; height: 4px; background: var(--gray-100); border-radius: 2px; overflow: hidden; }
    .strength-fill { height: 100%; border-radius: 2px; transition: width 0.3s;
      &.weak { background: var(--danger); }
      &.medium { background: var(--warning); }
      &.strong { background: var(--success); }
    }
    .strength-label { font-size: 0.72rem; color: var(--gray-400); }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .stat-mini { background: white; border-radius: var(--radius-md); padding: 16px; text-align: center; border: 1px solid var(--gray-200); border-top: 3px solid var(--color); }
    .stat-mini-icon { font-size: 1.5rem; margin-bottom: 6px; }
    .stat-mini-val { font-size: 1.5rem; font-weight: 800; color: var(--gray-900); margin-bottom: 2px; }
    .stat-mini-label { font-size: 0.72rem; color: var(--gray-400); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

    .dossiers-list { padding: 0 8px; }
    .dossier-row {
      display: flex; align-items: center; gap: 16px;
      padding: 14px 16px; border-bottom: 1px solid var(--gray-100);
      &:last-child { border-bottom: none; }
      &:hover { background: var(--gray-50); border-radius: var(--radius); }
    }
    .dossier-num { font-size: 0.75rem; font-weight: 700; color: var(--primary); font-family: monospace; min-width: 80px; }
    .dossier-info { flex: 1; }
    .dossier-assure { font-size: 0.875rem; font-weight: 600; color: var(--gray-800); margin-bottom: 2px; }
    .dossier-desc { font-size: 0.75rem; color: var(--gray-400); }
    .dossier-date { font-size: 0.75rem; color: var(--gray-400); min-width: 80px; text-align: right; }

    .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
    .badge-brouillon { background: #f1f5f9; color: #64748b; }
    .badge-soumis { background: #eff6ff; color: #3b82f6; }
    .badge-en_cours { background: #fefce8; color: #ca8a04; }
    .badge-incomplet { background: #fff7ed; color: #ea580c; }
    .badge-approuve { background: #f0fdf4; color: #16a34a; }
    .badge-rejete { background: #fef2f2; color: #dc2626; }

    .danger-zone { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; }
    .danger-title { font-weight: 700; color: var(--gray-800); margin-bottom: 4px; }
    .danger-desc { font-size: 0.82rem; color: var(--gray-400); }

    .loading-state, .empty-state { text-align: center; padding: 40px; color: var(--gray-400); }
    .empty-icon { font-size: 2.5rem; margin-bottom: 8px; }
    .spinner-lg { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 12px; }
    .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin-right: 6px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .btn-sm { padding: 6px 14px; font-size: 0.8rem; }
    .btn-danger { background: var(--danger); color: white; border: none; padding: 8px 18px; border-radius: var(--radius); font-weight: 600; cursor: pointer; font-family: var(--font-sans); }
  `]
})
export class AgentProfilComponent implements OnInit {
  authService = inject(AuthService);
  private api = inject(ApiService);
  private http = inject(HttpClient);

  user: User | null = null;
  activeTab: ActiveTab = 'infos';
  editMode = false;
  saving = false;
  savingPass = false;
  successMsg = '';
  errorMsg = '';
  showOld = false;
  showNew = false;

  mesDossiers: any[] = [];
  totalTraites = 0;
  totalEnCours = 0;
  loadingDossiers = false;
  statsCards: any[] = [];

  editForm = { prenom: '', nom: '', telephone: '', cin: '', adresse: '' };
  passwordForm = { ancien: '', nouveau: '', confirmer: '' };

  ngOnInit() {
    this.user = this.authService.currentUser();
    this.loadDossiers();
  }

  get initiales(): string {
    if (!this.user) return '?';
    return `${this.user.prenom?.[0] ?? ''}${this.user.nom?.[0] ?? ''}`.toUpperCase();
  }

  startEdit() {
    this.editForm = {
      prenom: this.user?.prenom ?? '', nom: this.user?.nom ?? '',
      telephone: this.user?.telephone ?? '', cin: this.user?.cin ?? '',
      adresse: this.user?.adresse ?? ''
    };
    this.editMode = true; this.successMsg = ''; this.errorMsg = '';
  }

  cancelEdit() { this.editMode = false; }

  sauvegarder() {
    this.saving = true; this.successMsg = ''; this.errorMsg = '';
    this.http.put<any>(`${environment.apiUrl}/agent/profil`, this.editForm).subscribe({
      next: () => {
        this.saving = false;
        const updated = { ...this.user!, ...this.editForm };
        this.authService.currentUser.set(updated);
        localStorage.setItem('med_user', JSON.stringify(updated));
        this.user = updated;
        this.editMode = false;
        this.successMsg = 'Profil mis à jour avec succès.';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => { this.saving = false; this.errorMsg = err.error?.message || 'Erreur lors de la mise à jour.'; }
    });
  }

  changerMotDePasse() {
    if (!this.canChangePass()) return;
    this.savingPass = true; this.successMsg = ''; this.errorMsg = '';
    this.http.post<any>(`${environment.apiUrl}/agent/profil/changer-mot-de-passe`, {
      ancienMotDePasse: this.passwordForm.ancien,
      nouveauMotDePasse: this.passwordForm.nouveau
    }).subscribe({
      next: () => {
        this.savingPass = false;
        this.passwordForm = { ancien: '', nouveau: '', confirmer: '' };
        this.successMsg = 'Mot de passe changé avec succès.';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => { this.savingPass = false; this.errorMsg = err.error?.message || 'Mot de passe actuel incorrect.'; }
    });
  }

  canChangePass(): boolean {
    return !!(this.passwordForm.ancien && this.passwordForm.nouveau &&
              this.passwordForm.nouveau.length >= 6 &&
              this.passwordForm.nouveau === this.passwordForm.confirmer);
  }

  loadDossiers() {
    this.loadingDossiers = true;
    this.api.getDossiersAgent({ size: 100 }).subscribe({
      next: (page: any) => {
        this.mesDossiers = page.content ?? [];
        this.totalTraites = this.mesDossiers.filter(d => ['APPROUVE','REJETE'].includes(d.statut)).length;
        this.totalEnCours = this.mesDossiers.filter(d => d.statut === 'EN_COURS').length;
        this.buildStats();
        this.loadingDossiers = false;
      },
      error: () => { this.loadingDossiers = false; }
    });
  }

  buildStats() {
    const statuts = this.mesDossiers.map(d => d.statut);
    this.statsCards = [
      { icon: '📁', label: 'Total assignés', value: this.mesDossiers.length, color: '#6366f1' },
      { icon: '⚙️', label: 'En cours', value: this.totalEnCours, color: '#f59e0b' },
      { icon: '✅', label: 'Approuvés', value: statuts.filter(s => s === 'APPROUVE').length, color: '#10b981' },
      { icon: '❌', label: 'Rejetés', value: statuts.filter(s => s === 'REJETE').length, color: '#ef4444' },
    ];
  }

  getStatutLabel(s: string): string {
    const m: Record<string, string> = {
      BROUILLON: 'Brouillon', SOUMIS: 'Soumis', EN_COURS: 'En cours',
      INCOMPLET: 'Incomplet', APPROUVE: 'Approuvé', REJETE: 'Rejeté'
    };
    return m[s] ?? s;
  }

  getStatutClass(s: string): string { return 'badge-' + s.toLowerCase(); }

  get strengthPct(): number {
    const p = this.passwordForm.nouveau; if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++; if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++; if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return (score / 5) * 100;
  }
  get strengthClass(): string { const p = this.strengthPct; return p <= 40 ? 'weak' : p <= 70 ? 'medium' : 'strong'; }
  get strengthLabel(): string { const p = this.strengthPct; return p <= 40 ? 'Faible' : p <= 70 ? 'Moyen' : 'Fort'; }
}
