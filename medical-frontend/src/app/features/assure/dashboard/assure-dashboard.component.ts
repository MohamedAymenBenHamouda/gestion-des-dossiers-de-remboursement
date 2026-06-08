import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Dossier, User } from '../../../core/models/models';
import { StatusLabelPipe, StatusClassPipe, Currency2Pipe, ShortDatePipe } from '../../../shared/pipes/shared.pipes';

@Component({
  selector: 'app-assure-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusLabelPipe, StatusClassPipe, Currency2Pipe, ShortDatePipe],
  template: `
  <div class="dash-page">

    <!-- HERO -->
    <div class="hero-banner">
      <div class="hero-circle-1"></div>
      <div class="hero-circle-2"></div>
      <div class="hero-left">
        <p class="hero-greeting">{{ greetingText }}</p>
        <h1 class="hero-name">{{ userName }}</h1>
        <p class="hero-date">{{ dateText }}</p>
      </div>
      <div class="hero-id-card">
        <div class="hic-top">
          <span class="hic-role">Assuré</span>
          <span class="hic-dot"></span>
        </div>
        <div class="hic-avatar">{{ userInitials }}</div>
        <div class="hic-cin">{{ userCin }}</div>
        <div class="hic-tel">{{ userTel }}</div>
        <a routerLink="/assure/profil" class="hic-edit">✏️ Modifier le profil</a>
      </div>
    </div>

    <!-- ALERTE INCOMPLETS -->
    @if (nbIncomplets > 0) {
      <div class="alert-strip">
        <span>⚠️</span>
        <span class="alert-text">
          <strong>{{ nbIncomplets }} dossier(s) incomplet(s)</strong>
          — votre agent demande des documents supplémentaires
        </span>
        <a routerLink="/assure/dossiers" class="alert-btn">Compléter →</a>
      </div>
    }

    <!-- KPI -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon" style="background:var(--primary-50)">📁</div>
        <div class="kpi-val">{{ nbTotal }}</div>
        <div class="kpi-lbl">Total dossiers</div>
        <div class="kpi-bar"><div class="kpi-fill" style="width:100%;background:var(--primary)"></div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:var(--warning-bg)">⚙️</div>
        <div class="kpi-val">{{ nbEnCours }}</div>
        <div class="kpi-lbl">En traitement</div>
        <div class="kpi-bar"><div class="kpi-fill" [style.width.%]="pct(nbEnCours)" style="background:var(--warning)"></div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:var(--success-bg)">✅</div>
        <div class="kpi-val">{{ nbApprouves }}</div>
        <div class="kpi-lbl">Approuvés</div>
        <div class="kpi-bar"><div class="kpi-fill" [style.width.%]="pct(nbApprouves)" style="background:var(--success)"></div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#f0fdf4">💰</div>
        <div class="kpi-val kpi-val-sm">{{ totalRembourse | currency2 }}</div>
        <div class="kpi-lbl">Total remboursé</div>
        <div class="kpi-bar"><div class="kpi-fill" [style.width.%]="pct(nbApprouves)" style="background:var(--success)"></div></div>
      </div>
    </div>

    <!-- SKELETON CHARGEMENT -->
    @if (loading) {
      <div class="skeleton-block"></div>
    }

    <!-- DERNIER DOSSIER -->
    @if (!loading && dernierDossier) {
      <div class="section-block">
        <p class="section-title">📌 Dernier dossier</p>
        <a [routerLink]="'/assure/dossiers/' + dernierDossier.id" class="spotlight">
          <div class="sp-header">
            <div>
              <span class="sp-num">{{ dernierDossier.numeroDossier }}</span>
              <div class="sp-desc">{{ dernierDossier.description || 'Sans description' }}</div>
            </div>
            <span [class]="dernierDossier.statut | statusClass">{{ dernierDossier.statut | statusLabel }}</span>
          </div>
          @if (dernierDossier.messageAgent) {
            <div class="sp-msg">💬 {{ dernierDossier.messageAgent }}</div>
          }
          <div class="sp-amounts">
            @if (dernierDossier.montantTotal) {
              <div class="sp-amt">
                <span class="sp-lbl">Montant demandé</span>
                <span class="sp-val">{{ dernierDossier.montantTotal | currency2 }}</span>
              </div>
            }
            @if (dernierDossier.statut === 'APPROUVE' && dernierDossier.montantRembourse) {
              <div class="sp-amt">
                <span class="sp-lbl">Remboursé</span>
                <span class="sp-val sp-green">{{ dernierDossier.montantRembourse | currency2 }}</span>
              </div>
            }
            <div class="sp-amt">
              <span class="sp-lbl">Créé le</span>
              <span class="sp-val">{{ dernierDossier.createdAt | shortDate }}</span>
            </div>
          </div>
          <!-- Workflow -->
          <div class="workflow">
            @for (step of wfSteps; track step.key; let last = $last) {
              <div class="wf-node"
                   [class.wf-done]="isWfDone(step.key)"
                   [class.wf-active]="isWfActive(step.key)">
                <div class="wf-dot">
                  @if (isWfDone(step.key) || isWfActive(step.key)) { {{ step.icon }} }
                </div>
                <div class="wf-lbl">{{ step.label }}</div>
              </div>
              @if (!last) {
                <div class="wf-line" [class.wf-line-done]="isWfDone(step.key)"></div>
              }
            }
          </div>
          <div class="sp-cta">Voir le dossier complet →</div>
        </a>
      </div>
    }

    @if (!loading && !dernierDossier) {
      <div class="empty-block">
        <div style="font-size:3rem;margin-bottom:12px">📋</div>
        <div class="empty-title">Aucun dossier pour l'instant</div>
        <p class="empty-sub">Créez votre premier dossier de remboursement médical</p>
        <a routerLink="/assure/dossiers" class="btn btn-primary" style="display:inline-flex;gap:6px;margin-top:12px">
          ＋ Créer un dossier
        </a>
      </div>
    }

    <!-- RACCOURCIS -->
    <div class="section-block">
      <p class="section-title">⚡ Accès rapide</p>
      <div class="shortcuts">
        <a routerLink="/assure/dossiers" class="sc">
          <span class="sc-ico">📝</span><span class="sc-lbl">Mes dossiers</span>
        </a>
        <a routerLink="/assure/chatbot" class="sc">
          <span class="sc-ico">🤖</span><span class="sc-lbl">Assistant </span>
        </a>
        <a routerLink="/assure/profil" class="sc">
          <span class="sc-ico">👤</span><span class="sc-lbl">Mon profil</span>
        </a>
        <a routerLink="/assure/profil" class="sc">
          <span class="sc-ico">🔑</span><span class="sc-lbl">Mot de passe</span>
        </a>
      </div>
    </div>

    <!-- HISTORIQUE -->
    @if (recentDossiers.length > 0) {
      <div class="section-block">
        <div class="section-header">
          <p class="section-title" style="margin:0">🕐 Historique récent</p>
          <a routerLink="/assure/dossiers" class="voir-tout">Tout voir →</a>
        </div>
        <div class="history-list">
          @for (d of recentDossiers; track d.id) {
            <a [routerLink]="'/assure/dossiers/' + d.id" class="history-row">
              <div class="hr-dot" [style.background]="statutBg(d.statut)">{{ statutIcon(d.statut) }}</div>
              <div class="hr-body">
                <div class="hr-top">
                  <span class="hr-num">{{ d.numeroDossier }}</span>
                  <span class="hr-date">{{ d.createdAt | shortDate }}</span>
                </div>
                <div class="hr-desc">{{ d.description || 'Sans description' }}</div>
              </div>
              <div class="hr-right">
                @if (d.statut === 'APPROUVE' && d.montantRembourse) {
                  <span class="hr-montant">+{{ d.montantRembourse | currency2 }}</span>
                }
                <span [class]="d.statut | statusClass" class="hr-badge">{{ d.statut | statusLabel }}</span>
              </div>
            </a>
          }
        </div>
      </div>
    }

  </div>
  `,
  styles: [`
    .dash-page { max-width: 900px; }

    /* Hero */
    .hero-banner {
      background: linear-gradient(135deg, var(--sidebar-bg) 0%, #1e3a5f 55%, var(--primary-dark) 100%);
      border-radius: var(--radius-xl); padding: 28px; margin-bottom: 20px;
      display: flex; align-items: flex-end; justify-content: space-between;
      gap: 20px; position: relative; overflow: hidden;
    }
    .hero-circle-1, .hero-circle-2 {
      position: absolute; border-radius: 50%; background: rgba(255,255,255,0.03);
    }
    .hero-circle-1 { width: 200px; height: 200px; top: -60px; right: 220px; }
    .hero-circle-2 { width: 260px; height: 260px; top: -80px; right: -50px; }
    .hero-left { z-index: 1; flex: 1; }
    .hero-greeting { font-size: 0.82rem; color: rgba(255,255,255,0.55); margin: 0 0 6px; }
    .hero-name { font-family: var(--font-display); font-size: 1.7rem; font-weight: 600; color: white; margin: 0 0 6px; line-height: 1.1; }
    .hero-date { font-size: 0.72rem; color: rgba(255,255,255,0.4); margin: 0; }
    .hero-id-card {
      z-index: 1; flex-shrink: 0;
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14);
      border-radius: var(--radius-lg); padding: 14px 16px; min-width: 150px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .hic-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .hic-role { font-size: 0.62rem; font-weight: 700; color: var(--primary-light); text-transform: uppercase; letter-spacing: 0.08em; }
    .hic-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px var(--success); }
    .hic-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; font-size: 0.85rem; font-weight: 800; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
    .hic-cin { font-size: 0.82rem; font-weight: 700; color: white; }
    .hic-tel { font-size: 0.72rem; color: rgba(255,255,255,0.5); }
    .hic-edit { font-size: 0.7rem; color: var(--primary-light); text-decoration: none; margin-top: 6px; font-weight: 600; }
    .hic-edit:hover { color: white; }

    /* Alerte */
    .alert-strip { display: flex; align-items: center; gap: 10px; background: var(--warning-bg); border: 1.5px solid #fde68a; border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 20px; }
    .alert-text { flex: 1; font-size: 0.85rem; color: #92400e; }
    .alert-btn { background: var(--warning); color: white; padding: 6px 14px; border-radius: var(--radius); font-size: 0.78rem; font-weight: 700; text-decoration: none; white-space: nowrap; }
    .alert-btn:hover { background: #d97706; }

    /* KPI */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
    .kpi-card { background: white; border: 1px solid var(--gray-100); border-radius: var(--radius-md); padding: 16px 14px; box-shadow: var(--shadow-sm); transition: transform 0.15s, box-shadow 0.15s; }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .kpi-icon { width: 38px; height: 38px; border-radius: var(--radius); display: flex; align-items: center; justify-content: center; font-size: 1.15rem; margin-bottom: 10px; }
    .kpi-val { font-size: 1.7rem; font-weight: 800; color: var(--gray-900); line-height: 1; margin-bottom: 4px; }
    .kpi-val-sm { font-size: 1rem; }
    .kpi-lbl { font-size: 0.68rem; color: var(--gray-400); font-weight: 600; text-transform: uppercase; margin-bottom: 10px; }
    .kpi-bar { height: 4px; background: var(--gray-100); border-radius: 99px; overflow: hidden; }
    .kpi-fill { height: 100%; border-radius: 99px; transition: width 0.7s ease; min-width: 4px; }

    /* Sections */
    .section-block { margin-bottom: 20px; }
    .section-title { font-size: 0.72rem; font-weight: 800; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.07em; margin: 0 0 10px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .voir-tout { font-size: 0.78rem; color: var(--primary); font-weight: 700; text-decoration: none; }
    .voir-tout:hover { text-decoration: underline; }

    /* Skeleton */
    .skeleton-block { height: 220px; background: linear-gradient(90deg, var(--gray-100) 25%, var(--gray-200) 50%, var(--gray-100) 75%); background-size: 200% 100%; border-radius: var(--radius-md); animation: shimmer 1.5s infinite; margin-bottom: 20px; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Spotlight */
    .spotlight { display: block; background: white; border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 20px; text-decoration: none; box-shadow: var(--shadow); transition: box-shadow 0.15s, transform 0.15s; }
    .spotlight:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
    .sp-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
    .sp-num { font-family: monospace; font-size: 0.78rem; font-weight: 700; color: var(--primary); display: block; margin-bottom: 4px; }
    .sp-desc { font-size: 0.9rem; font-weight: 600; color: var(--gray-800); }
    .sp-msg { font-size: 0.78rem; color: #92400e; background: var(--warning-bg); border-radius: var(--radius); padding: 7px 12px; margin-bottom: 12px; }
    .sp-amounts { display: flex; gap: 20px; flex-wrap: wrap; background: var(--gray-50); border-radius: var(--radius); padding: 10px 14px; margin-bottom: 16px; }
    .sp-amt { display: flex; flex-direction: column; gap: 2px; }
    .sp-lbl { font-size: 0.62rem; color: var(--gray-400); font-weight: 700; text-transform: uppercase; }
    .sp-val { font-size: 0.88rem; font-weight: 700; color: var(--gray-800); }
    .sp-green { color: var(--success) !important; }

    /* Workflow */
    .workflow { display: flex; align-items: center; margin-bottom: 16px; }
    .wf-node { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
    .wf-dot { width: 28px; height: 28px; border-radius: 50%; background: var(--gray-100); border: 2px solid var(--gray-200); display: flex; align-items: center; justify-content: center; font-size: 0.72rem; transition: all 0.25s; }
    .wf-lbl { font-size: 0.52rem; font-weight: 700; color: var(--gray-400); text-transform: uppercase; white-space: nowrap; }
    .wf-node.wf-done .wf-dot { background: var(--primary-50); border-color: var(--primary); }
    .wf-node.wf-done .wf-lbl { color: var(--primary); }
    .wf-node.wf-active .wf-dot { background: var(--primary); border-color: var(--primary); color: white; box-shadow: 0 0 0 3px var(--primary-100); }
    .wf-node.wf-active .wf-lbl { color: var(--primary); font-weight: 800; }
    .wf-line { flex: 1; height: 2px; background: var(--gray-200); margin: 0 4px; margin-bottom: 16px; }
    .wf-line.wf-line-done { background: var(--primary); }
    .sp-cta { text-align: center; font-size: 0.82rem; font-weight: 700; color: var(--primary); background: var(--primary-50); border-radius: var(--radius); padding: 9px; }

    /* Empty */
    .empty-block { background: white; border: 2px dashed var(--gray-200); border-radius: var(--radius-lg); padding: 40px 20px; text-align: center; margin-bottom: 20px; }
    .empty-title { font-size: 1rem; font-weight: 700; color: var(--gray-700); margin-bottom: 6px; }
    .empty-sub { font-size: 0.85rem; color: var(--gray-400); margin: 0; }

    /* Shortcuts */
    .shortcuts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .sc { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 8px; background: white; border: 1px solid var(--gray-100); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); text-decoration: none; color: var(--gray-700); transition: all 0.15s; }
    .sc:hover { border-color: var(--primary-100); background: var(--primary-50); color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow); }
    .sc-ico { font-size: 1.4rem; }
    .sc-lbl { font-size: 0.68rem; font-weight: 700; text-align: center; }

    /* History */
    .history-list { display: flex; flex-direction: column; gap: 8px; }
    .history-row { display: flex; align-items: center; gap: 12px; background: white; border: 1px solid var(--gray-100); border-radius: var(--radius-md); padding: 12px 14px; text-decoration: none; box-shadow: var(--shadow-sm); transition: all 0.12s; }
    .history-row:hover { border-color: var(--primary-100); transform: translateX(3px); }
    .hr-dot { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.88rem; flex-shrink: 0; }
    .hr-body { flex: 1; min-width: 0; }
    .hr-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
    .hr-num { font-family: monospace; font-size: 0.76rem; font-weight: 700; color: var(--primary); }
    .hr-date { font-size: 0.68rem; color: var(--gray-400); }
    .hr-desc { font-size: 0.78rem; color: var(--gray-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hr-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; margin-left: 8px; }
    .hr-montant { font-size: 0.78rem; font-weight: 800; color: var(--success); }
    .hr-badge { font-size: 0.62rem !important; padding: 2px 7px !important; }
  `]
})
export class AssureDashboardComponent implements OnInit {

  user: User | null = null;
  dossiers: Dossier[] = [];
  loading = true;

  greetingText = '';
  dateText = '';
  userName = '';
  userInitials = '';
  userCin = '';
  userTel = '';

  nbTotal = 0;
  nbEnCours = 0;
  nbApprouves = 0;
  nbIncomplets = 0;
  totalRembourse = 0;

  dernierDossier: Dossier | null = null;
  recentDossiers: Dossier[] = [];

  wfSteps: Array<{ key: string; label: string; icon: string }> = [
    { key: 'BROUILLON', label: 'Créé',    icon: '✏️' },
    { key: 'SOUMIS',    label: 'Soumis',  icon: '📤' },
    { key: 'EN_COURS',  label: 'Analyse', icon: '⚙️' },
    { key: 'FINAL',     label: 'Terminé', icon: '🏁' },
  ];

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser();
    if (this.user) {
      this.userName     = this.user.prenom + ' ' + this.user.nom;
      this.userInitials = (this.user.prenom[0] + this.user.nom[0]).toUpperCase();
      this.userCin      = this.user.cin       || 'CIN non renseigné';
      this.userTel      = this.user.telephone || 'Tél. non renseigné';
    }
    const h = new Date().getHours();
    this.greetingText = h < 12 ? 'Bonjour 👋' : h < 18 ? 'Bon après-midi 👋' : 'Bonsoir 👋';
    this.dateText = new Date().toLocaleDateString('fr-TN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    this.api.mesDossiers({ page: 0, size: 100, sort: 'createdAt,desc' }).subscribe({
      next: (page) => {
        this.dossiers        = page.content;
        this.dernierDossier  = this.dossiers[0] || null;
        this.recentDossiers  = this.dossiers.slice(0, 6);
        this.nbTotal         = this.dossiers.length;
        this.nbApprouves     = this.dossiers.filter(d => d.statut === 'APPROUVE').length;
        this.nbIncomplets    = this.dossiers.filter(d => d.statut === 'INCOMPLET').length;
        this.nbEnCours       = this.dossiers.filter(d => d.statut === 'EN_COURS' || d.statut === 'SOUMIS').length;
        this.totalRembourse  = this.dossiers
          .filter(d => d.statut === 'APPROUVE' && d.montantRembourse != null)
          .reduce((s, d) => s + (d.montantRembourse as number), 0);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  pct(v: number): number {
    return this.nbTotal === 0 ? 0 : Math.round((v / this.nbTotal) * 100);
  }

  isWfDone(key: string): boolean {
    if (!this.dernierDossier) return false;
    const s = this.dernierDossier.statut;
    const order = ['BROUILLON', 'SOUMIS', 'EN_COURS', 'APPROUVE', 'REJETE'];
    if (key === 'FINAL') return s === 'APPROUVE' || s === 'REJETE';
    return order.indexOf(key) < order.indexOf(s);
  }

  isWfActive(key: string): boolean {
    if (!this.dernierDossier) return false;
    const s = this.dernierDossier.statut;
    if (key === 'FINAL') return s === 'APPROUVE' || s === 'REJETE';
    return s === key;
  }

  statutBg(s: string): string {
    const m: Record<string, string> = {
      BROUILLON: 'var(--gray-100)', SOUMIS: 'var(--primary-100)',
      EN_COURS: 'var(--warning-bg)', INCOMPLET: '#ffedd5',
      APPROUVE: 'var(--success-bg)', REJETE: 'var(--danger-bg)',
    };
    return m[s] || 'var(--gray-100)';
  }

  statutIcon(s: string): string {
    const m: Record<string, string> = {
      BROUILLON: '✏️', SOUMIS: '📤', EN_COURS: '⚙️',
      INCOMPLET: '⚠️', APPROUVE: '✅', REJETE: '❌',
    };
    return m[s] || '📁';
  }
}
