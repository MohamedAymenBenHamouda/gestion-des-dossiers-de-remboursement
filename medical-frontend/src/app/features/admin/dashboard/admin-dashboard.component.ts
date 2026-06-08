import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { DashboardStats } from '../../../core/models/models';
import { Currency2Pipe } from '../../../shared/pipes/shared.pipes';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Currency2Pipe],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Tableau de bord</h1>
        <p class="page-subtitle">Vue d'ensemble · {{ today }}</p>
      </div>
    </div>

    <!-- SKELETON -->
    @if (loading) {
      <div class="skeleton-grid">
        @for (i of [1,2,3,4,5,6]; track i) { <div class="skeleton-card"></div> }
      </div>
    }

    @if (stats && !loading) {

      <!-- ═══════════════════════════════════
           ROW 1 — KPI DOSSIERS
      ═══════════════════════════════════ -->
      <div class="kpi-row">

        <div class="kpi-card kpi-blue">
          <div class="kpi-top">
            <div class="kpi-icon">📁</div>
            <div class="kpi-trend">Total</div>
          </div>
          <div class="kpi-value">{{ stats.totalDossiers }}</div>
          <div class="kpi-label">Dossiers créés</div>
          <div class="kpi-bar-track"><div class="kpi-bar-fill" [style.width.%]="100"></div></div>
        </div>

        <div class="kpi-card kpi-orange">
          <div class="kpi-top">
            <div class="kpi-icon">📤</div>
            <div class="kpi-trend trend-warn">⚡ Action requise</div>
          </div>
          <div class="kpi-value">{{ stats.dossiersSoumis }}</div>
          <div class="kpi-label">En attente de traitement</div>
          <div class="kpi-bar-track"><div class="kpi-bar-fill kpi-fill-orange" [style.width.%]="pct(stats.dossiersSoumis)"></div></div>
        </div>

        <div class="kpi-card kpi-yellow">
          <div class="kpi-top">
            <div class="kpi-icon">⚙️</div>
            <div class="kpi-trend">En traitement</div>
          </div>
          <div class="kpi-value">{{ stats.dossiersEnCours }}</div>
          <div class="kpi-label">Dossiers en cours</div>
          <div class="kpi-bar-track"><div class="kpi-bar-fill kpi-fill-yellow" [style.width.%]="pct(stats.dossiersEnCours)"></div></div>
        </div>

        <div class="kpi-card kpi-red">
          <div class="kpi-top">
            <div class="kpi-icon">⚠️</div>
            <div class="kpi-trend trend-warn">À compléter</div>
          </div>
          <div class="kpi-value">{{ stats.dossiersIncomplets }}</div>
          <div class="kpi-label">Dossiers incomplets</div>
          <div class="kpi-bar-track"><div class="kpi-bar-fill kpi-fill-red" [style.width.%]="pct(stats.dossiersIncomplets)"></div></div>
        </div>

        <div class="kpi-card kpi-green">
          <div class="kpi-top">
            <div class="kpi-icon">✅</div>
            <div class="kpi-trend trend-ok">Finalisés</div>
          </div>
          <div class="kpi-value">{{ stats.dossiersApprouves }}</div>
          <div class="kpi-label">Dossiers approuvés</div>
          <div class="kpi-bar-track"><div class="kpi-bar-fill kpi-fill-green" [style.width.%]="pct(stats.dossiersApprouves)"></div></div>
        </div>

        <div class="kpi-card kpi-gray">
          <div class="kpi-top">
            <div class="kpi-icon">❌</div>
            <div class="kpi-trend">Clôturés</div>
          </div>
          <div class="kpi-value">{{ stats.dossiersRejetes }}</div>
          <div class="kpi-label">Dossiers rejetés</div>
          <div class="kpi-bar-track"><div class="kpi-bar-fill kpi-fill-gray" [style.width.%]="pct(stats.dossiersRejetes)"></div></div>
        </div>

      </div>

      <!-- ═══════════════════════════════════
           ROW 2 — KPI FINANCIERS & USERS
      ═══════════════════════════════════ -->
      <div class="finance-row">

        <!-- Carte montant remboursé — grande -->
        <div class="finance-big-card">
          <div class="fb-header">
            <div class="fb-icon">💰</div>
            <div>
              <div class="fb-title">Total remboursé</div>
              <div class="fb-sub">Montants validés et versés aux assurés</div>
            </div>
          </div>
          <div class="fb-amount">{{ stats.totalMontantRembourse | currency2 }}</div>
          <div class="fb-row">
            <div class="fb-item">
              <span class="fb-item-label">Montant demandé</span>
              <span class="fb-item-val">{{ stats.totalMontantDemande | currency2 }}</span>
            </div>
            <div class="fb-item">
              <span class="fb-item-label">Taux de couverture</span>
              <span class="fb-item-val success">
                {{ coverageRate() }}%
              </span>
            </div>
          </div>
          <!-- Barre de progression couverture -->
          <div class="fb-progress-track">
            <div class="fb-progress-fill" [style.width.%]="coverageRate()"></div>
          </div>
          <div class="fb-progress-labels">
            <span>0 TND</span>
            <span>{{ stats.totalMontantDemande | currency2 }}</span>
          </div>
        </div>

        <!-- Taux d'approbation — jauge -->
        <div class="gauge-card">
          <div class="gauge-title">Taux d'approbation</div>
          <div class="gauge-wrapper">
            <svg viewBox="0 0 120 70" class="gauge-svg">
              <!-- Track -->
              <path d="M10,65 A55,55 0 0,1 110,65" fill="none" stroke="#e5e7eb" stroke-width="10" stroke-linecap="round"/>
              <!-- Fill -->
              <path d="M10,65 A55,55 0 0,1 110,65" fill="none"
                    [attr.stroke]="gaugeColor()"
                    stroke-width="10" stroke-linecap="round"
                    [attr.stroke-dasharray]="gaugeDash()"
                    stroke-dashoffset="0"/>
              <!-- Value -->
              <text x="60" y="58" text-anchor="middle" font-size="16" font-weight="800"
                    [attr.fill]="gaugeColor()">{{ stats.tauxApprobation }}%</text>
            </svg>
          </div>
          <div class="gauge-labels">
            <span class="gauge-bad">0%</span>
            <span class="gauge-label-center">{{ gaugeLabel() }}</span>
            <span class="gauge-good">100%</span>
          </div>
          <div class="gauge-detail">
            <span>{{ stats.dossiersApprouves }} approuvés</span>
            <span>sur {{ stats.totalDossiers }} total</span>
          </div>
        </div>

        <!-- Utilisateurs -->
        <div class="users-card">
          <div class="uc-title">👥 Utilisateurs</div>
          <div class="uc-items">
            <a [routerLink]="['/admin/utilisateurs']" [queryParams]="{role:'ROLE_ASSURE'}" class="uc-item">
              <div class="uc-avatar uc-assure">🧑‍⚕️</div>
              <div class="uc-info">
                <div class="uc-count">{{ stats.totalAssures }}</div>
                <div class="uc-lbl">Assurés</div>
              </div>
              <div class="uc-active">
                <div class="uc-active-val">{{ stats.assuresActifs }}</div>
                <div class="uc-active-lbl">actifs</div>
              </div>
            </a>
            <div class="uc-divider"></div>
            <a [routerLink]="['/admin/utilisateurs']" [queryParams]="{role:'ROLE_AGENT'}" class="uc-item">
              <div class="uc-avatar uc-agent">🧑‍💼</div>
              <div class="uc-info">
                <div class="uc-count">{{ stats.totalAgents }}</div>
                <div class="uc-lbl">Agents</div>
              </div>
              <div class="uc-active">
                <div class="uc-active-val">{{ stats.totalAdmins }}</div>
                <div class="uc-active-lbl">admins</div>
              </div>
            </a>
          </div>
          <!-- Alertes -->
          @if (stats.dossiersSoumis > 0) {
            <div class="uc-alert">
              <span>🔔</span>
              <span><strong>{{ stats.dossiersSoumis }}</strong> dossier(s) en attente d'agent</span>
              <a [routerLink]="['/admin/dossiers']" [queryParams]="{statut:'SOUMIS'}" class="alert-link">Voir →</a>
            </div>
          }
          @if (stats.dossiersIncomplets > 0) {
            <div class="uc-alert uc-alert-warn">
              <span>⚠️</span>
              <span><strong>{{ stats.dossiersIncomplets }}</strong> dossier(s) incomplet(s)</span>
              <a [routerLink]="['/admin/dossiers']" [queryParams]="{statut:'INCOMPLET'}" class="alert-link">Voir →</a>
            </div>
          }
        </div>

      </div>

      <!-- ═══════════════════════════════════
           ROW 3 — GRAPHIQUES
      ═══════════════════════════════════ -->
      <div class="charts-row">

        <!-- Répartition par statut — barres horizontales -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">📊 Répartition par statut</span>
            <span class="chart-total">{{ stats.totalDossiers }} total</span>
          </div>
          <div class="card-body">
            @for (entry of statutEntries(); track entry[0]) {
              <div class="hbar-row">
                <div class="hbar-label">
                  <span class="hbar-dot" [style.background]="statutColor(entry[0])"></span>
                  {{ statutLabel(entry[0]) }}
                </div>
                <div class="hbar-track">
                  <div class="hbar-fill"
                       [style.width.%]="pct(entry[1])"
                       [style.background]="statutColor(entry[0])">
                  </div>
                </div>
                <div class="hbar-vals">
                  <span class="hbar-count">{{ entry[1] }}</span>
                  <span class="hbar-pct">{{ pct(entry[1]) | number:'1.0-0' }}%</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Évolution mensuelle — barres verticales -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">📅 Évolution mensuelle</span>
            <span class="chart-total">Dossiers soumis par mois</span>
          </div>
          <div class="card-body">
            @if (monthEntries().length > 0) {
              <div class="vbar-chart">
                @for (entry of monthEntries(); track entry[0]) {
                  <div class="vbar-col">
                    <div class="vbar-val">{{ entry[1] }}</div>
                    <div class="vbar-track">
                      <div class="vbar-fill" [style.height.%]="monthPct(entry[1])"></div>
                    </div>
                    <div class="vbar-label">{{ shortMonth(entry[0]) }}</div>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-chart">
                <div style="font-size:2.5rem; margin-bottom:8px;">📊</div>
                <p>Aucune donnée mensuelle disponible</p>
              </div>
            }
          </div>
        </div>

      </div>

    }<!-- end @if stats -->
  `,
  styles: [`
    /* ── Skeleton ───────────────── */
    .skeleton-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:14px; margin-bottom:24px; }
    .skeleton-card { height:100px; border-radius:var(--radius-md); background:linear-gradient(90deg,var(--gray-100) 25%,var(--gray-200) 50%,var(--gray-100) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* ── KPI Row ─────────────────── */
    .kpi-row { display:grid; grid-template-columns:repeat(6,1fr); gap:14px; margin-bottom:20px; }
    .kpi-card { background:white; border-radius:var(--radius-md); padding:16px; border:1px solid var(--gray-100); box-shadow:var(--shadow-sm); transition:transform 0.15s,box-shadow 0.15s; }
    .kpi-card:hover { transform:translateY(-2px); box-shadow:var(--shadow-md); }
    .kpi-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px; }
    .kpi-icon { font-size:1.4rem; }
    .kpi-trend { font-size:0.68rem; font-weight:600; color:var(--gray-400); text-transform:uppercase; letter-spacing:0.04em; text-align:right; }
    .trend-ok { color:#059669; }
    .trend-warn { color:#d97706; }
    .kpi-value { font-size:1.9rem; font-weight:800; color:var(--gray-900); line-height:1; margin-bottom:4px; }
    .kpi-label { font-size:0.75rem; color:var(--gray-500); font-weight:500; margin-bottom:12px; }
    .kpi-bar-track { height:4px; background:var(--gray-100); border-radius:99px; overflow:hidden; }
    .kpi-bar-fill { height:100%; border-radius:99px; transition:width 0.8s ease; min-width:2%; }
    .kpi-blue .kpi-bar-fill { background:var(--primary); }
    .kpi-fill-orange { background:#f97316; }
    .kpi-fill-yellow { background:#f59e0b; }
    .kpi-fill-red { background:#ef4444; }
    .kpi-fill-green { background:#10b981; }
    .kpi-fill-gray { background:#9ca3af; }
    .kpi-blue { border-top:3px solid var(--primary); }
    .kpi-orange { border-top:3px solid #f97316; }
    .kpi-yellow { border-top:3px solid #f59e0b; }
    .kpi-red { border-top:3px solid #ef4444; }
    .kpi-green { border-top:3px solid #10b981; }
    .kpi-gray { border-top:3px solid #9ca3af; }

    /* ── Finance Row ─────────────── */
    .finance-row { display:grid; grid-template-columns:2fr 1fr 1.5fr; gap:16px; margin-bottom:20px; }

    /* Finance big card */
    .finance-big-card { background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%); border-radius:var(--radius-md); padding:22px; color:white; box-shadow:var(--shadow-md); }
    .fb-header { display:flex; align-items:center; gap:14px; margin-bottom:16px; }
    .fb-icon { font-size:2rem; width:48px; height:48px; background:rgba(255,255,255,0.1); border-radius:12px; display:flex; align-items:center; justify-content:center; }
    .fb-title { font-family:'Fraunces',serif; font-size:1rem; font-weight:600; }
    .fb-sub { font-size:0.72rem; opacity:0.6; margin-top:2px; }
    .fb-amount { font-size:2rem; font-weight:800; letter-spacing:-0.02em; margin-bottom:16px; }
    .fb-row { display:flex; gap:20px; margin-bottom:10px; }
    .fb-item { flex:1; }
    .fb-item-label { font-size:0.72rem; opacity:0.6; display:block; margin-bottom:2px; }
    .fb-item-val { font-size:0.9rem; font-weight:700; }
    .fb-item-val.success { color:#34d399; }
    .fb-progress-track { height:6px; background:rgba(255,255,255,0.15); border-radius:99px; overflow:hidden; margin-bottom:4px; }
    .fb-progress-fill { height:100%; background:linear-gradient(90deg,#34d399,#059669); border-radius:99px; transition:width 1s ease; }
    .fb-progress-labels { display:flex; justify-content:space-between; font-size:0.65rem; opacity:0.5; }

    /* Gauge */
    .gauge-card { background:white; border-radius:var(--radius-md); padding:20px; border:1px solid var(--gray-100); box-shadow:var(--shadow-sm); display:flex; flex-direction:column; align-items:center; }
    .gauge-title { font-size:0.85rem; font-weight:700; color:var(--gray-700); margin-bottom:8px; text-align:center; }
    .gauge-wrapper { width:100%; max-width:160px; }
    .gauge-svg { width:100%; overflow:visible; }
    .gauge-labels { display:flex; justify-content:space-between; align-items:center; width:100%; max-width:160px; margin-top:2px; }
    .gauge-bad,.gauge-good { font-size:0.65rem; color:var(--gray-400); font-weight:600; }
    .gauge-label-center { font-size:0.72rem; font-weight:700; color:var(--gray-600); }
    .gauge-detail { display:flex; justify-content:space-between; width:100%; margin-top:10px; padding-top:10px; border-top:1px solid var(--gray-100); }
    .gauge-detail span { font-size:0.75rem; color:var(--gray-500); font-weight:600; }

    /* Users card */
    .users-card { background:white; border-radius:var(--radius-md); padding:20px; border:1px solid var(--gray-100); box-shadow:var(--shadow-sm); }
    .uc-title { font-size:0.875rem; font-weight:700; color:var(--gray-700); margin-bottom:14px; }
    .uc-items { display:flex; flex-direction:column; gap:0; }
    .uc-item { display:flex; align-items:center; gap:12px; padding:10px 0; text-decoration:none; border-radius:var(--radius); padding:8px; transition:background 0.15s; }
    .uc-item:hover { background:var(--gray-50); }
    .uc-avatar { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0; }
    .uc-assure { background:#d1fae5; }
    .uc-agent { background:#dbeafe; }
    .uc-info { flex:1; }
    .uc-count { font-size:1.4rem; font-weight:800; color:var(--gray-900); line-height:1; }
    .uc-lbl { font-size:0.72rem; color:var(--gray-500); font-weight:500; }
    .uc-active { text-align:right; }
    .uc-active-val { font-size:1rem; font-weight:700; color:var(--primary); }
    .uc-active-lbl { font-size:0.65rem; color:var(--gray-400); }
    .uc-divider { height:1px; background:var(--gray-100); margin:4px 0; }
    .uc-alert { display:flex; align-items:center; gap:8px; margin-top:10px; background:#fff7ed; border:1px solid #fed7aa; border-radius:var(--radius); padding:8px 10px; font-size:0.78rem; color:#92400e; }
    .uc-alert-warn { background:#fefce8; border-color:#fde68a; color:#713f12; }
    .uc-alert span:first-child { flex-shrink:0; }
    .uc-alert span:nth-child(2) { flex:1; }
    .alert-link { font-weight:700; color:inherit; text-decoration:none; white-space:nowrap; &:hover { text-decoration:underline; } }

    /* ── Charts Row ─────────────── */
    .charts-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
    .chart-total { font-size:0.78rem; color:var(--gray-400); font-weight:600; }

    /* Horizontal bars */
    .hbar-row { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
    .hbar-label { width:95px; display:flex; align-items:center; gap:6px; font-size:0.78rem; color:var(--gray-600); font-weight:600; flex-shrink:0; }
    .hbar-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .hbar-track { flex:1; height:10px; background:var(--gray-100); border-radius:99px; overflow:hidden; }
    .hbar-fill { height:100%; border-radius:99px; transition:width 0.7s ease; min-width:2%; }
    .hbar-vals { display:flex; flex-direction:column; align-items:flex-end; width:46px; }
    .hbar-count { font-size:0.82rem; font-weight:700; color:var(--gray-800); line-height:1; }
    .hbar-pct { font-size:0.65rem; color:var(--gray-400); }

    /* Vertical bars */
    .vbar-chart { display:flex; align-items:flex-end; gap:8px; height:140px; padding-bottom:0; }
    .vbar-col { display:flex; flex-direction:column; align-items:center; flex:1; height:100%; }
    .vbar-val { font-size:0.65rem; font-weight:700; color:var(--gray-600); margin-bottom:3px; }
    .vbar-track { flex:1; width:100%; background:var(--gray-100); border-radius:6px 6px 0 0; overflow:hidden; display:flex; align-items:flex-end; }
    .vbar-fill { width:100%; background:linear-gradient(180deg,var(--primary-light),var(--primary)); border-radius:6px 6px 0 0; transition:height 0.7s ease; min-height:2px; }
    .vbar-label { font-size:0.65rem; color:var(--gray-400); font-weight:600; margin-top:4px; text-align:center; }
    .empty-chart { text-align:center; padding:30px 0; color:var(--gray-400); font-size:0.875rem; }

    @media (max-width: 1280px) {
      .kpi-row { grid-template-columns: repeat(3, 1fr); }
      .finance-row { grid-template-columns: 1fr 1fr; }
      .users-card { grid-column: span 2; }
    }
    @media (max-width: 900px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .finance-row, .charts-row { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  today = new Date().toLocaleDateString('fr-TN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getDashboard().subscribe({
      next: (data) => { this.stats = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  pct(val: number): number {
    if (!this.stats || this.stats.totalDossiers === 0) return 0;
    return Math.round((val / this.stats.totalDossiers) * 100);
  }

  coverageRate(): number {
    if (!this.stats || !this.stats.totalMontantDemande) return 0;
    return Math.round((this.stats.totalMontantRembourse / this.stats.totalMontantDemande) * 100);
  }

  statutEntries(): [string, number][] {
    if (!this.stats) return [];
    const order = ['APPROUVE','EN_COURS','SOUMIS','INCOMPLET','REJETE','BROUILLON'];
    return order
      .filter(k => this.stats!.dossiersParStatut[k] !== undefined)
      .map(k => [k, this.stats!.dossiersParStatut[k]] as [string, number]);
  }

  statutLabel(k: string): string {
    return { BROUILLON:'Brouillon', SOUMIS:'Soumis', EN_COURS:'En cours',
             INCOMPLET:'Incomplet', APPROUVE:'Approuvé', REJETE:'Rejeté' }[k] ?? k;
  }

  statutColor(k: string): string {
    return { BROUILLON:'#9ca3af', SOUMIS:'#3b82f6', EN_COURS:'#f59e0b',
             INCOMPLET:'#f97316', APPROUVE:'#10b981', REJETE:'#ef4444' }[k] ?? '#9ca3af';
  }

  monthEntries(): [string, number][] {
    if (!this.stats?.dossiersParMois) return [];
    return Object.entries(this.stats.dossiersParMois).slice(-12);
  }

  monthMax(): number {
    const vals = this.monthEntries().map(e => e[1]);
    return vals.length ? Math.max(...vals, 1) : 1;
  }

  monthPct(val: number): number {
    return Math.round((val / this.monthMax()) * 100);
  }

  shortMonth(key: string): string {
    // key peut être "2025-01" ou "Jan"
    if (key.includes('-')) {
      const [, m] = key.split('-');
      const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
      return months[parseInt(m) - 1] ?? key;
    }
    return key.substring(0, 3);
  }

  gaugeColor(): string {
    const t = this.stats?.tauxApprobation ?? 0;
    if (t >= 70) return '#10b981';
    if (t >= 40) return '#f59e0b';
    return '#ef4444';
  }

  gaugeLabel(): string {
    const t = this.stats?.tauxApprobation ?? 0;
    if (t >= 70) return '✅ Excellent';
    if (t >= 40) return '⚠️ Moyen';
    return '❌ Faible';
  }

  gaugeDash(): string {
    // Arc semi-circulaire = longueur ≈ 172.8 (rayon 55 * π)
    const arc = 172.8;
    const t = this.stats?.tauxApprobation ?? 0;
    const filled = (t / 100) * arc;
    return `${filled} ${arc}`;
  }
}