import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Dossier } from '../../../core/models/models';
import { StatusLabelPipe, StatusClassPipe, ShortDatePipe, Currency2Pipe } from '../../../shared/pipes/shared.pipes';

@Component({
  selector: 'app-assure-dossiers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusLabelPipe, StatusClassPipe, ShortDatePipe, Currency2Pipe],
  template: `
  <div class="page-header">
    <div>
      <h1 class="page-title">Mes dossiers</h1>
      <p class="page-subtitle">{{ totalElements }} dossier(s)</p>
    </div>
    <button class="btn btn-primary" (click)="showCreateModal = true">
      ＋ Nouveau dossier
    </button>
  </div>

  

  @if (createError) {
    <div class="alert alert-danger" style="margin-bottom:16px">⚠️ {{ createError }}</div>
  }

  <!-- Filtres statut -->
  <div class="filter-pills">
    @for (f of filters; track f.key) {
      <button class="fp" [class.fp-active]="activeFilter === f.key" (click)="setFilter(f.key)">
        {{ f.icon }} {{ f.label }}
        @if (f.key !== '' && countFor(f.key) > 0) {
          <span class="fp-count">{{ countFor(f.key) }}</span>
        }
      </button>
    }
  </div>

  <!-- Cartes dossiers -->
  <div class="cards-list">
    @if (loading) {
      @for (i of [1,2,3]; track i) { <div class="card-skeleton"></div> }
    }

    @for (d of filteredDossiers; track d.id) {
      <a [routerLink]="'/assure/dossiers/' + d.id" class="dossier-card">
        <div class="dc-top">
          <div class="dc-left">
            <span class="dc-num">{{ d.numeroDossier }}</span>
            <div class="dc-desc">{{ d.description || 'Sans description' }}</div>
          </div>
          <span [class]="d.statut | statusClass">{{ d.statut | statusLabel }}</span>
        </div>
        @if (d.messageAgent) {
          <div class="dc-msg">💬 {{ d.messageAgent }}</div>
        }
        <div class="dc-footer">
          <span class="dc-meta">📎 {{ d.documents.length }} doc(s) · 📅 {{ d.createdAt | shortDate }}</span>
          @if (d.statut === 'APPROUVE' && d.montantRembourse) {
            <span class="dc-amount">✅ {{ d.montantRembourse | currency2 }}</span>
          }
        </div>
      </a>
    }

    @if (filteredDossiers.length === 0 && !loading) {
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>Aucun dossier</h3>
        <p>Cliquez sur "＋ Nouveau dossier" pour commencer</p>
      </div>
    }
  </div>

  <!-- MODAL CRÉATION DOSSIER -->
  @if (showCreateModal) {
    <div class="modal-overlay" (click)="showCreateModal=false">
      <div class="modal" (click)="$event.stopPropagation()" style="max-width:500px">
        <div class="modal-header">
          <span class="modal-title">Nouveau Dossier Médical</span>
          <button class="btn btn-icon btn-secondary" (click)="showCreateModal=false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="field-label">Type de Soin</label>
            <select class="form-control" [(ngModel)]="newDossier.typeSoin">
              <option value="">-- Sélectionnez un type --</option>
              @for (ts of typeSoinsOptions; track ts.key) {
                <option [value]="ts.key">{{ ts.label }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label class="field-label">Pour</label>
            <select class="form-control" [(ngModel)]="newDossier.beneficiaryId">
              <option [ngValue]="null">Moi-même</option>
              @for (f of familyMembers; track f.id) {
                <option [ngValue]="f.id">{{ f.prenom }} {{ f.nom }} — {{ f.relation }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label class="field-label">Description / Note brève</label>
            <input type="text" class="form-control" [(ngModel)]="newDossier.description" placeholder="Ex: Consultation dentaire du 12/05..." />
          </div>
          @if (createError) {
            <div class="alert alert-danger" style="margin-top: 10px;">⚠️ {{ createError }}</div>
          }
        </div>
        <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;">
          <button class="btn btn-secondary" (click)="showCreateModal=false">Annuler</button>
          <button class="btn btn-primary" (click)="creerDossier()" [disabled]="creating || !newDossier.typeSoin">
            @if (creating) { <span class="btn-spin"></span> } @else { Créer }
          </button>
        </div>
      </div>
    </div>
  }
  
  <!-- Pagination (bas de page) -->
  @if (totalPages > 1) {
    <div class="pagination page-bottom">
      @for (p of pageNumbers; track p) {
        <button class="pg" [class.pg-active]="page === p" (click)="goToPage(p)">{{ p + 1 }}</button>
      }
    </div>
  }

  `,
  styles: [`
    .filter-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .fp { background: white; border: 1.5px solid var(--gray-200); color: var(--gray-500); padding: 6px 14px; border-radius: 99px; font-size: 0.78rem; font-weight: 600; cursor: pointer; font-family: var(--font-sans); display: flex; align-items: center; gap: 5px; transition: all 0.15s; }
    .fp:hover { border-color: var(--primary-100); color: var(--primary); }
    .fp-active { background: var(--primary) !important; border-color: var(--primary) !important; color: white !important; }
    .fp-count { background: rgba(255,255,255,0.25); border-radius: 99px; padding: 0 6px; font-size: 0.65rem; font-weight: 800; }
    .btn-spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .cards-list { display: flex; flex-direction: column; gap: 10px; }
    .dossier-card { display: block; background: white; border-radius: var(--radius-lg); padding: 16px; border: 1px solid var(--gray-100); box-shadow: var(--shadow-sm); text-decoration: none; transition: all 0.15s; }
    .dossier-card:hover { border-color: var(--primary-100); box-shadow: var(--shadow-md); transform: translateY(-1px); }
    .dc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
    .dc-left { flex: 1; min-width: 0; }
    .dc-num { font-family: monospace; font-size: 0.75rem; font-weight: 700; color: var(--primary); display: block; margin-bottom: 3px; }
    .dc-desc { font-size: 0.875rem; font-weight: 600; color: var(--gray-800); }
    .dc-msg { font-size: 0.75rem; color: #92400e; background: var(--warning-bg); border-radius: var(--radius); padding: 5px 10px; margin-bottom: 8px; }
    .dc-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--gray-100); padding-top: 8px; }
    .dc-meta { font-size: 0.72rem; color: var(--gray-400); }
    .dc-amount { font-size: 0.8rem; font-weight: 700; color: var(--success); }
    .card-skeleton { height: 95px; background: linear-gradient(90deg, var(--gray-50) 25%, var(--gray-100) 50%, var(--gray-50) 75%); background-size: 200% 100%; border-radius: var(--radius-lg); animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .field-label { font-size: 0.75rem; font-weight: 700; color: var(--gray-500); text-transform: uppercase; margin-bottom: 5px; display: block; }
    .pagination { display:flex; gap:8px; justify-content:center; margin-top:12px; }
    .pg { border:1px solid var(--gray-200); background:white; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:700; }
    .pg-active { background:var(--primary); color:white; border-color:var(--primary); }
    .page-bottom { margin-top: 28px; }
  `]
})
export class AssureDossiersComponent implements OnInit {

  dossiers: Dossier[] = [];
  familyMembers: any[] = [];
  totalElements = 0;
  page = 0;
  pageSize = 10;
  totalPages = 0;
  loading = false;
  creating = false;
  createError = '';
  activeFilter = '';

  filters = [
    { key: '', icon: '🗂️', label: 'Tous' },
    { key: 'BROUILLON', icon: '✏️', label: 'Brouillon' },
    { key: 'SOUMIS', icon: '📤', label: 'Soumis' },
    { key: 'EN_COURS', icon: '⚙️', label: 'En cours' },
    { key: 'INCOMPLET', icon: '⚠️', label: 'Incomplets' },
    { key: 'APPROUVE', icon: '✅', label: 'Approuvés' },
    { key: 'REJETE', icon: '❌', label: 'Rejetés' },
  ];

  showCreateModal = false;
  newDossier = {
    description: 'Nouveau dossier',
    motif: '',
    typeSoin: '',
    beneficiaryId: null
  };

  typeSoinsOptions = [
    { key: 'CONSULTATION', label: 'Consultation' },
    { key: 'HOSPITALISATION', label: 'Hospitalisation' },
    { key: 'DENTAIRE', label: 'Soins Dentaires' },
    { key: 'OPTIQUE', label: 'Optique' },
    { key: 'ALD', label: 'Maladie Chronique (ALD)' },
  ];



  constructor(private api: ApiService, private router: Router) { }

  ngOnInit(): void { this.load(); }

  ngAfterViewInit(): void { this.loadFamily(); }

  loadFamily() {
    this.api.getFamilyMembers().subscribe({
      next: (list) => {
        const all = list || [];
        this.familyMembers = all.filter((f: any) => {
          if (!f) return false;
          const prenom = (f.prenom ?? '').toString().trim();
          const nom    = (f.nom    ?? '').toString().trim();
          // Drop completely blank entries or placeholder dashes
          if ((prenom === '' && nom === '') ||
              (prenom === '-' && nom === '-') ||
              (prenom === '-' || nom === '-')) return false;
          return true;
        });
      },
      error: () => this.familyMembers = []
    });
  }

  load(): void {
    this.loading = true;
    this.api.mesDossiers({ page: this.page, size: this.pageSize, sort: 'createdAt,desc' }).subscribe({
      next: (page) => {
        this.dossiers = page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages ?? Math.ceil((page.totalElements||0) / this.pageSize);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  creerDossier(): void {
    if (!this.newDossier.typeSoin) return;
    this.creating = true;
    this.createError = '';
    this.api.creerDossier(this.newDossier).subscribe({
      next: (dossier: any) => {
        this.creating = false;
        this.showCreateModal = false;
        this.router.navigate(['/assure/dossiers', dossier.id]);
      },
      error: (err: any) => {
        this.creating = false;
        this.createError = err.error?.message || 'Erreur lors de la création.';
      }
    });
  }

  get filteredDossiers(): Dossier[] {
    if (!this.activeFilter) return this.dossiers;
    return this.dossiers.filter(d => d.statut === this.activeFilter);
  }

  setFilter(key: string): void { this.activeFilter = key; }

  countFor(key: string): number {
    return this.dossiers.filter(d => d.statut === key).length;
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.load();
  }
}
