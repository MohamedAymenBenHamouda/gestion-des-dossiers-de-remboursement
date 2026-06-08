import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Dossier, User } from '../../../core/models/models';
import { StatusLabelPipe, StatusClassPipe, Currency2Pipe, ShortDatePipe } from '../../../shared/pipes/shared.pipes';

@Component({
  selector: 'app-admin-dossiers',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusLabelPipe, StatusClassPipe, Currency2Pipe, ShortDatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{ currentStatutLabel || 'Tous les dossiers' }}
        </h1>
        <p class="page-subtitle">{{ totalElements }} dossier(s) trouvé(s)</p>
      </div>
    </div>

    <!-- Barre de filtres -->
    <div class="filters-card">

      <!-- Recherche texte -->
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          class="search-input"
          [(ngModel)]="searchText"
          (ngModelChange)="onSearchChange()"
          placeholder="Rechercher par N° dossier, assuré, motif..."
        />
        @if (searchText) {
          <button class="search-clear" (click)="searchText=''; onSearchChange()">✕</button>
        }
      </div>

      <!-- Filtre statut -->
      <div class="filter-group">
        <label class="filter-label">Statut</label>
        <select class="filter-select" [(ngModel)]="filterStatut" (change)="onFilterChange()">
          <option value="">Tous</option>
          <option value="BROUILLON">✏️ Brouillon</option>
          <option value="SOUMIS">📤 Soumis</option>
          <option value="EN_COURS">⚙️ En cours</option>
          <option value="INCOMPLET">⚠️ Incomplet</option>
          <option value="APPROUVE">✅ Approuvé</option>
          <option value="REJETE">❌ Rejeté</option>
        </select>
      </div>

      <!-- Filtre agent avec recherche -->
      <div class="filter-group agent-filter">
        <label class="filter-label">Agent</label>
        <div class="agent-search-wrapper">
          <input
            class="filter-select"
            [(ngModel)]="agentSearch"
            (ngModelChange)="filterAgentsList()"
            (focus)="showAgentDropdown = true"
            (blur)="hideAgentDropdown()"
            [placeholder]="selectedAgent ? (selectedAgent.prenom + ' ' + selectedAgent.nom) : 'Rechercher un agent...'"
            [class.has-value]="selectedAgent"
          />
          @if (selectedAgent) {
            <button class="agent-clear" (mousedown)="clearAgent()">✕</button>
          }
          @if (showAgentDropdown && filteredAgents.length > 0) {
            <div class="agent-dropdown">
              <div class="agent-option" (mousedown)="selectAgent(null)">
                <span class="agent-all">👥 Tous les agents</span>
              </div>
              @for (agent of filteredAgents; track agent.id) {
                <div class="agent-option" (mousedown)="selectAgent(agent)">
                  <div class="agent-avatar">{{ agent.prenom[0] }}{{ agent.nom[0] }}</div>
                  <div class="agent-info">
                    <span class="agent-name">{{ agent.prenom }} {{ agent.nom }}</span>
                    <span class="agent-email">{{ agent.email }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Effacer tout -->
      @if (filterStatut || selectedAgent || searchText) {
        <button class="btn-clear-all" (click)="clearAll()">
          🗑️ Effacer tout
        </button>
      }

    </div>

    <!-- Badges statut actifs -->
    <div class="active-filters" *ngIf="filterStatut || selectedAgent || searchText">
      @if (searchText) {
        <span class="filter-badge">
          🔍 "{{ searchText }}"
          <button (click)="searchText=''; onSearchChange()">✕</button>
        </span>
      }
      @if (filterStatut) {
        <span class="filter-badge">
          {{ getStatutLabel(filterStatut) }}
          <button (click)="filterStatut=''; onFilterChange()">✕</button>
        </span>
      }
      @if (selectedAgent) {
        <span class="filter-badge">
          👤 {{ selectedAgent.prenom }} {{ selectedAgent.nom }}
          <button (click)="clearAgent()">✕</button>
        </span>
      }
    </div>

    <!-- Tableau -->
    <div class="card">
      @if (loading) {
        <div class="loading-bar"></div>
      }
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>N° Dossier</th>
              <th>Description</th>
              <th>Assuré</th>
              <th>Agent assigné</th>
              <th>Statut</th>
              <th>Montant demandé</th>
              <th>Montant remboursé</th>
              <th>Date création</th>
              <th>Date soumission</th>
            </tr>
          </thead>
          <tbody>
            @for (d of dossiers; track d.id) {
              <tr class="table-row-hover">
                <td>
                  <span class="dossier-num">{{ d.numeroDossier }}</span>
                </td>
                <td>
                  @if (d.description) {
                    <div class="note-cell" [title]="d.description">
                      {{ d.description | slice:0:40 }}{{ d.description.length > 40 ? '…' : '' }}
                    </div>
                  } @else {
                    <span class="no-agent">—</span>
                  }
                </td>
                <td>
                  <div class="user-cell">
                    <div class="user-cell-avatar">{{ d.assure.prenom[0] }}{{ d.assure.nom[0] }}</div>
                    <div>
                      <div class="user-cell-name">{{ d.assure.prenom }} {{ d.assure.nom }}</div>
                      <div class="user-cell-email">{{ d.assure.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  @if (d.agent) {
                    <div class="user-cell">
                      <div class="user-cell-avatar agent-av">{{ d.agent.prenom[0] }}{{ d.agent.nom[0] }}</div>
                      <span class="user-cell-name">{{ d.agent.prenom }} {{ d.agent.nom }}</span>
                    </div>
                  } @else {
                    <span class="no-agent">— Non assigné</span>
                  }
                </td>
                <td><span [class]="d.statut | statusClass">{{ d.statut | statusLabel }}</span></td>
                <td class="amount-cell">{{ d.montantTotal | currency2 }}</td>
                <td class="amount-cell">
                  @if (d.statut === 'APPROUVE') {
                    <span class="amount-approved">{{ d.montantRembourse | currency2 }}</span>
                  } @else { <span class="no-agent">—</span> }
                </td>
                <td class="date-cell">{{ d.createdAt | shortDate }}</td>
                <td class="date-cell">{{ d.dateSoumission | shortDate }}</td>
              </tr>
            }
            @if (dossiers.length === 0 && !loading) {
              <tr>
                <td colspan="9">
                  <div class="empty-state">
                    <div class="empty-icon">📂</div>
                    <h3>Aucun dossier trouvé</h3>
                    <p>Essayez de modifier vos critères de recherche</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (totalPages > 1) {
        <div class="pagination-bar">
          <span class="pagination-info">Page {{ currentPage + 1 }} / {{ totalPages }} · {{ totalElements }} dossiers</span>
          <div class="pagination">
            <button (click)="goPage(0)" [disabled]="currentPage === 0">«</button>
            <button (click)="goPage(currentPage - 1)" [disabled]="currentPage === 0">‹</button>
            @for (p of getPages(); track p) {
              <button [class.active]="p === currentPage" (click)="goPage(p)">{{ p + 1 }}</button>
            }
            <button (click)="goPage(currentPage + 1)" [disabled]="currentPage >= totalPages - 1">›</button>
            <button (click)="goPage(totalPages - 1)" [disabled]="currentPage >= totalPages - 1">»</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .filters-card {
      background: white; border: 1px solid var(--gray-200); border-radius: var(--radius-md);
      padding: 16px 20px; margin-bottom: 14px;
      display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;
      box-shadow: var(--shadow-sm);
    }
    .search-box {
      display: flex; align-items: center; gap: 8px;
      background: var(--gray-50); border: 1.5px solid var(--gray-200);
      border-radius: var(--radius); padding: 0 12px; min-width: 260px; flex: 1;
      transition: border-color 0.15s;
      &:focus-within { border-color: var(--primary); background: white; }
    }
    .search-icon { font-size: 0.9rem; color: var(--gray-400); }
    .search-input {
      border: none; background: transparent; outline: none; padding: 9px 0;
      font-size: 0.875rem; font-family: var(--font-sans); flex: 1; color: var(--gray-800);
      &::placeholder { color: var(--gray-400); }
    }
    .search-clear {
      background: none; border: none; cursor: pointer; color: var(--gray-400);
      font-size: 0.75rem; padding: 2px 4px; border-radius: 4px;
      &:hover { color: var(--danger); background: var(--danger-bg); }
    }
    .filter-group { display: flex; flex-direction: column; gap: 4px; }
    .filter-label { font-size: 0.72rem; font-weight: 700; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em; }
    .filter-select {
      border: 1.5px solid var(--gray-200); border-radius: var(--radius); padding: 8px 12px;
      font-size: 0.875rem; font-family: var(--font-sans); color: var(--gray-800);
      outline: none; background: var(--gray-50); min-width: 160px;
      transition: border-color 0.15s;
      &:focus { border-color: var(--primary); background: white; }
    }
    .filter-select.has-value { border-color: var(--primary); background: var(--primary-50); color: var(--primary); font-weight: 600; }

    /* Agent search dropdown */
    .agent-filter { position: relative; }
    .agent-search-wrapper { position: relative; }
    .agent-clear {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: var(--gray-400); font-size: 0.75rem;
      &:hover { color: var(--danger); }
    }
    .agent-dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 200;
      background: white; border: 1.5px solid var(--gray-200); border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg); max-height: 240px; overflow-y: auto;
    }
    .agent-option {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      cursor: pointer; transition: background 0.1s;
      &:hover { background: var(--gray-50); }
    }
    .agent-all { font-size: 0.875rem; color: var(--gray-600); font-weight: 600; }
    .agent-avatar {
      width: 30px; height: 30px; background: var(--primary-100); color: var(--primary);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 0.72rem; font-weight: 700; flex-shrink: 0;
    }
    .agent-info { display: flex; flex-direction: column; }
    .agent-name { font-size: 0.85rem; font-weight: 600; color: var(--gray-800); }
    .agent-email { font-size: 0.72rem; color: var(--gray-400); }

    .btn-clear-all {
      background: var(--danger-bg); border: 1px solid #fca5a5; color: var(--danger);
      border-radius: var(--radius); padding: 8px 14px; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; font-family: var(--font-sans); transition: all 0.15s; align-self: flex-end;
      &:hover { background: var(--danger); color: white; }
    }

    /* Active filter badges */
    .active-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .filter-badge {
      display: flex; align-items: center; gap: 6px;
      background: var(--primary-50); border: 1px solid var(--primary-100);
      color: var(--primary); padding: 4px 10px; border-radius: 16px;
      font-size: 0.78rem; font-weight: 600;
      button { background: none; border: none; cursor: pointer; color: var(--primary); font-size: 0.7rem; padding: 0; line-height: 1; &:hover { color: var(--danger); } }
    }

    /* Loading bar */
    .loading-bar {
      height: 3px; background: linear-gradient(90deg, var(--primary), var(--accent), var(--primary));
      background-size: 200% 100%; animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Table */
    .dossier-num { font-family: monospace; font-weight: 700; font-size: 0.8rem; color: var(--primary); }
    .user-cell { display: flex; align-items: center; gap: 8px; }
    .user-cell-avatar {
      width: 28px; height: 28px; background: var(--primary-100); color: var(--primary);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 0.68rem; font-weight: 700; flex-shrink: 0;
    }
    .agent-av { background: #e0f2fe; color: #0284c7; }
    .user-cell-name { font-size: 0.85rem; font-weight: 600; color: var(--gray-800); }
    .user-cell-email { font-size: 0.72rem; color: var(--gray-400); }
    .note-cell { font-size:0.78rem; color:var(--gray-600); max-width:160px; cursor:help; }
    .no-agent { font-size: 0.8rem; color: var(--gray-400); font-style: italic; }
    .amount-cell { font-weight: 600; font-size: 0.85rem; }
    .amount-approved { color: var(--success); font-weight: 700; }
    .date-cell { font-size: 0.82rem; color: var(--gray-500); }
    .table-row-hover:hover td { background: var(--gray-50); }

    .pagination-bar { padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--gray-100); flex-wrap: wrap; gap: 10px; }
    .pagination-info { font-size: 0.8rem; color: var(--gray-500); }

    .empty-state { text-align: center; padding: 48px 20px; }
    .empty-icon { font-size: 3rem; margin-bottom: 12px; }
    .empty-state h3 { font-size: 1rem; color: var(--gray-700); margin-bottom: 6px; }
    .empty-state p { font-size: 0.85rem; color: var(--gray-400); }
  `]
})
export class AdminDossiersComponent implements OnInit {
  dossiers: Dossier[] = [];
  loading = false;
  filterStatut = '';
  searchText = '';
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;

  // Agents
  agents: User[] = [];
  filteredAgents: User[] = [];
  selectedAgent: User | null = null;
  agentSearch = '';
  showAgentDropdown = false;

  private searchTimer: any;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    // Lire le query param "statut" depuis l'URL (venant du sous-menu sidebar)
    this.route.queryParams.subscribe(params => {
      this.filterStatut = params['statut'] ?? '';
      this.currentPage = 0;
      this.load();
    });
    this.loadAgents();
  }

  loadAgents() {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agents = agents;
        this.filteredAgents = agents;
      },
      error: () => {}
    });
  }

  filterAgentsList() {
    const q = this.agentSearch.toLowerCase();
    this.filteredAgents = this.agents.filter(a =>
      `${a.prenom} ${a.nom} ${a.email}`.toLowerCase().includes(q)
    );
  }

  selectAgent(agent: User | null) {
    this.selectedAgent = agent;
    this.agentSearch = '';
    this.showAgentDropdown = false;
    this.currentPage = 0;
    this.load();
  }

  clearAgent() {
    this.selectedAgent = null;
    this.agentSearch = '';
    this.currentPage = 0;
    this.load();
  }

  hideAgentDropdown() {
    setTimeout(() => this.showAgentDropdown = false, 150);
  }

  onSearchChange() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage = 0;
      this.load();
    }, 350);
  }

  onFilterChange() {
    this.currentPage = 0;
    this.load();
  }

  load() {
    this.loading = true;
    const params: any = { page: this.currentPage, size: 15, sort: 'createdAt,desc' };
    if (this.filterStatut)      params['statut']  = this.filterStatut;
    if (this.selectedAgent)     params['agentId'] = this.selectedAgent.id;
    if (this.searchText?.trim()) params['search'] = this.searchText.trim();

    this.api.getTousDossiers(params).subscribe({
      next: (page) => {
        this.dossiers = page.content;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  clearAll() {
    this.filterStatut = '';
    this.selectedAgent = null;
    this.agentSearch = '';
    this.searchText = '';
    this.currentPage = 0;
    this.load();
  }

  get currentStatutLabel(): string {
    const labels: Record<string, string> = {
      'BROUILLON': '✏️ Dossiers Brouillon',
      'SOUMIS': '📤 Dossiers Soumis',
      'EN_COURS': '⚙️ Dossiers En cours',
      'INCOMPLET': '⚠️ Dossiers Incomplets',
      'APPROUVE': '✅ Dossiers Approuvés',
      'REJETE': '❌ Dossiers Rejetés',
    };
    return labels[this.filterStatut] ?? '';
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'BROUILLON': '✏️ Brouillon', 'SOUMIS': '📤 Soumis',
      'EN_COURS': '⚙️ En cours',  'INCOMPLET': '⚠️ Incomplet',
      'APPROUVE': '✅ Approuvé',   'REJETE': '❌ Rejeté',
    };
    return labels[statut] ?? statut;
  }

  goPage(p: number) { this.currentPage = p; this.load(); }
  getPages(): number[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    const pages: number[] = [];
    const start = Math.max(0, cur - 2);
    const end   = Math.min(total - 1, cur + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
}
