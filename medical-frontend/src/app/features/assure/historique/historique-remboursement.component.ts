import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Dossier } from '../../../core/models/models';
import { ShortDatePipe, Currency2Pipe } from '../../../shared/pipes/shared.pipes';

@Component({
  selector: 'app-historique-remboursement',
  standalone: true,
  imports: [CommonModule, RouterLink, ShortDatePipe, Currency2Pipe],
  template: `
  <div class="page-header">
    <div>
      <h1 class="page-title">Historique de remboursement</h1>
      <p class="page-subtitle">Consultez vos remboursements approuvés</p>
    </div>
  </div>

  <div class="historique-view">
    <div class="historique-summary">
      <div>
        <h2 class="hs-title">Total Remboursé</h2>
        <p class="hs-subtitle">Cumul de tous vos dossiers approuvés ({{ historiqueDossiers.length }})</p>
      </div>
      <div class="hs-amount">{{ totalRembourse | currency2 }}</div>
    </div>

    <div class="cards-list">
      @if (loading) {
        @for (i of [1,2]; track i) { <div class="card-skeleton"></div> }
      }

      @for (d of historiqueDossiers; track d.id) {
        <a [routerLink]="'/assure/dossiers/' + d.id" class="dossier-card">
          <div class="dc-top">
            <div class="dc-left">
              <span class="dc-num">{{ d.numeroDossier }}</span>
              <div class="dc-desc">{{ typeSoinLabel(d.typeSoin) }} - {{ d.description || 'Sans description' }}</div>
            </div>
            <span class="dc-amount">+ {{ getMontantDossier(d) | currency2 }}</span>
          </div>
          <div class="dc-footer">
             <span class="dc-meta">Remboursé le : {{ (d.dateValidation || d.createdAt) | shortDate }}</span>
            <span class="dc-meta">Demande initiale : {{ getDemandeInitiale(d) | currency2 }}</span>
          </div>
        </a>
      }
      
      @if (historiqueDossiers.length === 0 && !loading) {
        <div class="empty-state">
          <div class="empty-icon">💸</div>
          <h3>Aucun remboursement</h3>
          <p>Vous n'avez pas encore de dossiers approuvés.</p>
        </div>
      }
    </div>
  </div>
  `,
  styles: [`
    .historique-summary { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border: 1px solid #86efac; border-radius: var(--radius-lg); padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm); }
    .hs-title { color: #166534; font-size: 1.25rem; font-weight: 700; margin: 0 0 4px 0; }
    .hs-subtitle { color: #15803d; font-size: 0.85rem; margin: 0; font-weight: 500; }
    .hs-amount { font-size: 2.2rem; font-weight: 800; color: #14532d; letter-spacing: -0.02em; }

    .cards-list { display: flex; flex-direction: column; gap: 10px; }
    .dossier-card { display: block; background: white; border-radius: var(--radius-lg); padding: 16px; border: 1px solid var(--gray-100); box-shadow: var(--shadow-sm); text-decoration: none; transition: all 0.15s; }
    .dossier-card:hover { border-color: var(--primary-100); box-shadow: var(--shadow-md); transform: translateY(-1px); }
    .dc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
    .dc-left { flex: 1; min-width: 0; }
    .dc-num { font-family: monospace; font-size: 0.75rem; font-weight: 700; color: var(--primary); display: block; margin-bottom: 3px; }
    .dc-desc { font-size: 0.875rem; font-weight: 600; color: var(--gray-800); }
    .dc-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--gray-100); padding-top: 8px; margin-top: 8px; }
    .dc-meta { font-size: 0.72rem; color: var(--gray-400); }
    .dc-amount { font-size: 1.1rem; font-weight: 700; color: var(--success); }
    
    .card-skeleton { height: 95px; background: linear-gradient(90deg, var(--gray-50) 25%, var(--gray-100) 50%, var(--gray-50) 75%); background-size: 200% 100%; border-radius: var(--radius-lg); animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  `]
})
export class HistoriqueRemboursementComponent implements OnInit {

  dossiers: Dossier[] = [];
  loading = false;

  typeSoinsOptions = [
    { key: 'CONSULTATION', label: 'Consultation' },
    { key: 'HOSPITALISATION', label: 'Hospitalisation' },
    { key: 'DENTAIRE', label: 'Soins Dentaires' },
    { key: 'OPTIQUE', label: 'Optique' },
    { key: 'ALD', label: 'Maladie Chronique (ALD)' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.api.mesDossiers({ page: 0, size: 100, sort: 'createdAt,desc' }).subscribe({
      next: (page) => {
        this.dossiers = page.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get historiqueDossiers(): Dossier[] {
    return this.dossiers.filter(d => d.statut === 'APPROUVE');
  }

  get totalRembourse(): number {
    return this.historiqueDossiers.reduce((somme, d) => somme + this.getMontantDossier(d), 0);
  }

  getMontantDossier(d: Dossier): number {
    if (d.montantRembourse && d.montantRembourse > 0) return d.montantRembourse;
    if (!d.documents) return 0;
    return d.documents
      .filter((doc: any) => doc.statutIA === 'VALIDE' && doc.analyseIA?.remboursement?.montant_rembourse)
      .reduce((s: number, doc: any) => s + (doc.analyseIA.remboursement.montant_rembourse || 0), 0);
  }

  getDemandeInitiale(d: Dossier): number {
    if (d.montantTotal && d.montantTotal > 0) return d.montantTotal;
    if (!d.documents) return 0;
    return d.documents
      .filter((doc: any) => doc.statutIA === 'VALIDE' && doc.analyseIA?.facture?.montant_ttc)
      .reduce((s: number, doc: any) => s + (doc.analyseIA.facture.montant_ttc || 0), 0);
  }

  typeSoinLabel(ts?: string): string {
    if (!ts) return '';
    const option = this.typeSoinsOptions.find(o => o.key === ts);
    return option ? option.label : ts;
  }
}
