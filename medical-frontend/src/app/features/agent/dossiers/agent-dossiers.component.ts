import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Dossier } from '../../../core/models/models';
import { StatusLabelPipe, StatusClassPipe, Currency2Pipe, ShortDatePipe } from '../../../shared/pipes/shared.pipes';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-agent-dossiers',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusLabelPipe, StatusClassPipe, Currency2Pipe, ShortDatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dossiers</h1>
        <p class="page-subtitle">{{ totalElements }} dossier(s)</p>
      </div>
    </div>

    <div class="card" style="margin-bottom: 16px;">
      <div class="card-body" style="padding: 12px 20px;">
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <select class="form-control" style="width:160px;" [(ngModel)]="filterStatut" (change)="load()">
            <option value="">Tous statuts</option>
            <option value="SOUMIS">Soumis</option>
            <option value="EN_COURS">En cours</option>
            <option value="APPROUVE">Approuvé</option>
            <option value="REJETE">Rejeté</option>
            <option value="INCOMPLET">Incomplet</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>N° Dossier</th>
              <th>Assuré</th>
              <th>Note</th>
              <th>Statut</th>
              <th>Montant IA</th>
              <th>Remboursé</th>
              <th>Soumis le</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            @for (d of dossiers; track d.id) {
              <tr>
                <td style="font-family:monospace; font-weight:700; color:var(--primary); font-size:0.8rem;">{{ d.numeroDossier }}</td>
                <td>{{ d.assure.prenom }} {{ d.assure.nom }}</td>
                <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.82rem; color:var(--gray-500);">
                  {{ d.description || '—' }}
                </td>
                <td><span [class]="d.statut | statusClass">{{ d.statut | statusLabel }}</span></td>
                <td>{{ d.montantCalculeIA | currency2 }}</td>
                <td>
                  @if (d.statut === 'APPROUVE') {
                    <span style="color:var(--success); font-weight:700;">{{ d.montantRembourse | currency2 }}</span>
                  } @else { — }
                </td>
                <td>{{ d.dateSoumission | shortDate }}</td>
                <td>
                  @if (d.statut === 'SOUMIS') {
                    <button class="btn btn-sm btn-primary" (click)="prendreEnCharge(d)">▶ Prendre</button>
                  } @else if (d.statut === 'EN_COURS') {
                    <button class="btn btn-sm btn-primary" (click)="openValidation(d)">⚖️ Traiter</button>
                  } @else { — }
                </td>
              </tr>
            }
            @if (dossiers.length === 0 && !loading) {
              <tr>
                <td colspan="8">
                  <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <h3>Aucun dossier trouvé</h3>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages > 1) {
        <div style="padding:16px 20px; display:flex; align-items:center; justify-content:space-between; border-top:1px solid var(--gray-100);">
          <span style="font-size:0.8rem; color:var(--gray-500);">Page {{ currentPage + 1 }} / {{ totalPages }}</span>
          <div class="pagination">
            <button (click)="goPage(currentPage - 1)" [disabled]="currentPage === 0">‹</button>
            @for (p of getPages(); track p) {
              <button [class.active]="p === currentPage" (click)="goPage(p)">{{ p + 1 }}</button>
            }
            <button (click)="goPage(currentPage + 1)" [disabled]="currentPage >= totalPages - 1">›</button>
          </div>
        </div>
      }
    </div>

    <!-- Modal validation -->
    <!-- LIGHTBOX -->
    @if (lightboxUrl) {
      <div class="lightbox-overlay" (click)="lightboxUrl=null">
        <div class="lightbox-box" (click)="$event.stopPropagation()">
          <button class="lightbox-close" (click)="lightboxUrl=null">✕</button>
          <img [src]="lightboxUrl" alt="Document" class="lightbox-img" />
        </div>
      </div>
    }

    @if (selectedDossier) {
      <div class="modal-overlay" (click)="selectedDossier = null">
        <div class="modal" (click)="$event.stopPropagation()" style="max-width:720px;max-height:90vh;overflow-y:auto">
          <div class="modal-header">
            <span class="modal-title">Traiter le dossier {{ selectedDossier.numeroDossier }}</span>
            <button class="btn btn-icon btn-secondary" (click)="selectedDossier = null">✕</button>
          </div>
          <div class="modal-body">

            <!-- Info assuré -->
            <div style="background:var(--gray-50); border-radius:var(--radius); padding:14px; margin-bottom:16px">
              <div style="font-weight:600; color:var(--gray-900); margin-bottom:4px">
                {{ selectedDossier.assure.prenom }} {{ selectedDossier.assure.nom }}
              </div>
              <div style="font-size:0.8rem; color:var(--gray-500)">{{ selectedDossier.assure.email }}</div>
              @if (selectedDossier.montantTotal) {
                <div style="font-size:0.8rem; color:var(--gray-700); margin-top:4px; font-weight:600">
                  💰 Montant demandé : {{ selectedDossier.montantTotal | currency2 }}
                </div>
              }
              @if (selectedDossier.montantCalculeIA) {
                <div style="font-size:0.8rem; color:var(--info); margin-top:2px">
                  🤖 Suggestion IA : {{ selectedDossier.montantCalculeIA | currency2 }}
                </div>
              }
            </div>

            <!-- Note de l'assuré -->
            @if (selectedDossier.description) {
              <div style="margin-bottom:16px">
                <div style="font-size:0.75rem; font-weight:700; color:var(--gray-600); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;">
                  📝 Note de l'assuré
                </div>
                <div style="background:var(--primary-50); border:1px solid var(--primary-100); border-radius:var(--radius); padding:10px 14px; font-size:0.875rem; color:var(--gray-700); line-height:1.5;">
                  {{ selectedDossier.description }}
                </div>
              </div>
            }

            <!-- Documents avec images -->
            @if (selectedDossier.documents.length > 0) {
              <div style="margin-bottom:16px">
                <div style="font-size:0.75rem; font-weight:700; color:var(--gray-600); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.05em;">
                  📎 Documents ({{ selectedDossier.documents.length }})
                </div>
                <div class="docs-grid">
                  @for (doc of selectedDossier.documents; track doc.id) {
                    <div class="doc-tile" [class.doc-tile-ok]="doc.statutIA==='VALIDE'" [class.doc-tile-ko]="doc.statutIA==='INVALIDE'">

                      <!-- Aperçu image ou icône PDF -->
                      <div class="doc-preview" (click)="openImage(doc)">
                        @if (isImage(doc.contentType)) {
                          @if (getImageSrc(doc.id)) {
                            <img [src]="getImageSrc(doc.id)" alt="{{ doc.nomFichier }}"
                                 class="doc-img" />
                            <div class="doc-zoom-hint">🔍 Agrandir</div>
                          } @else {
                            <div class="doc-loading" (click)="loadImage(doc.id); $event.stopPropagation()">
                              <div class="mini-spin-gray"></div>
                              <span>Chargement...</span>
                            </div>
                          }
                        } @else {
                          <div class="doc-pdf-icon">
                            <span>📋</span>
                            <span style="font-size:0.7rem;margin-top:4px">PDF</span>
                          </div>
                        }
                        <!-- Badge statut IA sur l'image -->
                        <div class="doc-ia-overlay"
                          [class.ia-ov-ok]="doc.statutIA==='VALIDE'"
                          [class.ia-ov-ko]="doc.statutIA==='INVALIDE'"
                          [class.ia-ov-wait]="doc.statutIA==='EN_ATTENTE'">
                          {{ doc.statutIA === 'VALIDE' ? '✅' : doc.statutIA === 'INVALIDE' ? '❌' : '⏳' }}
                        </div>
                      </div>

                      <!-- Infos sous l'image -->
                      <div class="doc-tile-info">
                        <div class="doc-tile-type">{{ getDocTypeLabel(doc.type) }}</div>

                        @if (doc.resultatIA) {
                          <!-- Carte d'analyse structurée -->
                          <div class="doc-analysis-card"
                               [class.analysis-ok]="doc.statutIA === 'VALIDE'"
                               [class.analysis-ko]="doc.statutIA === 'INVALIDE'">

                            <!-- Statut badge -->
                            <div class="analysis-status"
                                 [class.status-valide]="doc.statutIA === 'VALIDE'"
                                 [class.status-invalide]="doc.statutIA === 'INVALIDE'"
                                 [class.status-attente]="doc.statutIA !== 'VALIDE' && doc.statutIA !== 'INVALIDE'">
                              {{ doc.statutIA === 'VALIDE' ? '✅ Analyse Terminée' : doc.statutIA === 'INVALIDE' ? '❌ Document Invalide' : '⏳ En attente' }}
                            </div>

                            <!-- Prestataire -->
                            @if (getAnalyseField(doc.resultatIA, 'prestataire')) {
                              <div class="analysis-row">
                                <span class="analysis-icon">🏥</span>
                                <div class="analysis-content">
                                  <span class="analysis-label">Prestataire</span>
                                  <span class="analysis-value">{{ getAnalyseField(doc.resultatIA, 'prestataire') }}</span>
                                </div>
                              </div>
                            }

                            <!-- Total -->
                            @if (getAnalyseField(doc.resultatIA, 'total')) {
                              <div class="analysis-row">
                                <span class="analysis-icon">💶</span>
                                <div class="analysis-content">
                                  <span class="analysis-label">Total</span>
                                  <span class="analysis-value analysis-amount">{{ getAnalyseField(doc.resultatIA, 'total') }}</span>
                                </div>
                              </div>
                            } @else if (doc.montantDetecteIA) {
                              <div class="analysis-row">
                                <span class="analysis-icon">💶</span>
                                <div class="analysis-content">
                                  <span class="analysis-label">Total</span>
                                  <span class="analysis-value analysis-amount">{{ doc.montantDetecteIA | currency2 }}</span>
                                </div>
                              </div>
                            }

                            <!-- Remboursement estimé -->
                            @if (getAnalyseField(doc.resultatIA, 'remboursement')) {
                              <div class="analysis-row">
                                <span class="analysis-icon">💚</span>
                                <div class="analysis-content">
                                  <span class="analysis-label">Remboursement estimé</span>
                                  <span class="analysis-value analysis-rembours">{{ getAnalyseField(doc.resultatIA, 'remboursement') }}</span>
                                </div>
                              </div>
                            }

                            <!-- Texte brut si pas de champs parsés -->
                            @if (!getAnalyseField(doc.resultatIA, 'prestataire') && !getAnalyseField(doc.resultatIA, 'total') && !getAnalyseField(doc.resultatIA, 'remboursement')) {
                              <div class="analysis-raw" [class.analysis-raw-ko]="doc.statutIA === 'INVALIDE'">{{ doc.resultatIA }}</div>
                            }

                          </div>
                        } @else if (doc.montantDetecteIA) {
                          <div class="doc-tile-amount">💰 {{ doc.montantDetecteIA | currency2 }}</div>
                        }

                        <!-- Bouton voir fichier PDF -->
                        @if (!isImage(doc.contentType)) {
                          <a [href]="getFileUrl(doc.id)" target="_blank" class="btn btn-sm btn-secondary" style="margin-top:6px; display:block; text-align:center;">
                            📄 Ouvrir le fichier
                          </a>
                        }
                      </div>

                    </div>
                  }
                </div>
              </div>
            }

            <!-- Décision -->
            <div style="margin-bottom:14px">
              <div style="font-size:0.75rem; font-weight:700; color:var(--gray-600); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.05em;">
                ⚖️ Décision
              </div>
              <div style="display:flex; gap:8px; margin-bottom:14px">
                <button [class]="'btn btn-sm ' + (decision === 'approve'    ? 'btn-success' : 'btn-secondary')" (click)="decision = 'approve'">✅ Approuver</button>
                <button [class]="'btn btn-sm ' + (decision === 'incomplete' ? 'btn-warning' : 'btn-secondary')" (click)="decision = 'incomplete'">⚠️ Incomplet</button>
                <button [class]="'btn btn-sm ' + (decision === 'reject'     ? 'btn-danger'  : 'btn-secondary')" (click)="decision = 'reject'">❌ Rejeter</button>
              </div>
              @if (decision === 'incomplete') {
                <div class="form-group">
                  <label class="form-label">Message à l'assuré (documents manquants)</label>
                  <textarea class="form-control" [(ngModel)]="validationNote" rows="3" placeholder="Ex: Merci de fournir le reçu original..."></textarea>
                </div>
              }
              @if (decision === 'reject') {
                <div class="form-group">
                  <label class="form-label">Motif de rejet</label>
                  <textarea class="form-control" [(ngModel)]="validationNote" rows="3" placeholder="Expliquez la raison du rejet..."></textarea>
                </div>
              }
              @if (decision === 'approve') {
                <div class="form-group">
                  <label class="form-label">Note (optionnel)</label>
                  <textarea class="form-control" [(ngModel)]="validationNote" rows="2" placeholder="Note interne..."></textarea>
                </div>
              }
            </div>

            @if (validationError) {
              <div class="alert alert-danger">{{ validationError }}</div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedDossier = null">Annuler</button>
            <button class="btn btn-primary" (click)="submitValidation()" [disabled]="!decision || submitting">
              {{ submitting ? 'Envoi...' : 'Confirmer la décision' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .docs-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .doc-tile { border: 1.5px solid var(--gray-200); border-radius: var(--radius-md); overflow: hidden; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .doc-tile-ok { border-color: var(--success); }
    .doc-tile-ko { border-color: var(--danger); }
    .doc-preview { position: relative; height: 130px; background: var(--gray-50); cursor: pointer; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .doc-preview:hover .doc-zoom-hint { opacity: 1; }
    .doc-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s; }
    .doc-preview:hover .doc-img { transform: scale(1.04); }
    .doc-zoom-hint { position: absolute; inset: 0; background: rgba(0,0,0,0.35); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.82rem; font-weight: 600; opacity: 0; transition: opacity 0.2s; }
    .doc-pdf-icon { display: flex; flex-direction: column; align-items: center; color: var(--gray-400); font-size: 2rem; }
    .doc-ia-overlay { position: absolute; top: 6px; right: 6px; font-size: 1rem; background: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
    .ia-ov-ok   { background: var(--success-bg); }
    .ia-ov-ko   { background: var(--danger-bg); }
    .ia-ov-wait { background: var(--warning-bg); }
    /* --- doc-tile-info --- */
    .doc-tile-info { padding: 10px 12px; }
    .doc-tile-type { font-size: 0.72rem; font-weight: 700; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
    .doc-tile-amount { font-size: 0.78rem; font-weight: 700; color: var(--success); margin-top: 4px; }
    .doc-tile-rapport { font-size: 0.7rem; color: var(--gray-500); margin-top: 4px; line-height: 1.4; }
    .doc-tile-ko-txt { color: var(--danger); }
    /* --- analyse card --- */
    .doc-analysis-card { border-radius: 8px; overflow: hidden; border: 1px solid var(--gray-100); background: var(--gray-50); margin-top: 2px; }
    .analysis-ok { border-color: #d1fae5; background: #f0fdf4; }
    .analysis-ko { border-color: #fee2e2; background: #fff5f5; }
    /* status badge */
    .analysis-status { font-size: 0.72rem; font-weight: 700; padding: 5px 10px; letter-spacing: 0.02em; }
    .status-valide   { background: #d1fae5; color: #065f46; }
    .status-invalide { background: #fee2e2; color: #991b1b; }
    .status-attente  { background: #fef3c7; color: #92400e; }
    /* rows */
    .analysis-row { display: flex; align-items: flex-start; gap: 7px; padding: 5px 10px; border-top: 1px solid rgba(0,0,0,0.05); }
    .analysis-icon { font-size: 0.9rem; line-height: 1.4; flex-shrink: 0; }
    .analysis-content { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .analysis-label { font-size: 0.62rem; font-weight: 600; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.04em; }
    .analysis-value { font-size: 0.78rem; font-weight: 600; color: var(--gray-800); line-height: 1.3; word-break: break-word; }
    .analysis-amount  { color: #1d4ed8; }
    .analysis-rembours { color: #065f46; font-size: 0.82rem; }
    .analysis-raw { font-size: 0.7rem; color: var(--gray-500); padding: 6px 10px; line-height: 1.4; }
    .analysis-raw-ko { color: var(--danger); }
    /* lightbox */
    .lightbox-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.88); z-index: 2000; display: flex; align-items: center; justify-content: center; }
    .lightbox-box { position: relative; max-width: 90vw; max-height: 90vh; }
    .lightbox-img { max-width: 90vw; max-height: 88vh; object-fit: contain; border-radius: var(--radius-md); }
    .doc-loading { display:flex; flex-direction:column; align-items:center; gap:6px; color:var(--gray-400); font-size:0.72rem; cursor:pointer; }
    .mini-spin-gray { width:20px; height:20px; border:2px solid var(--gray-200); border-top-color:var(--gray-500); border-radius:50%; animation:spin 0.8s linear infinite; }
    .lightbox-close { position: absolute; top: -14px; right: -14px; background: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 10; }
  `]
})
export class AgentDossiersComponent implements OnInit {
  dossiers: Dossier[] = [];
  loading = false;
  filterStatut = '';
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 10;

  selectedDossier: Dossier | null = null;
  decision: 'approve' | 'reject' | 'incomplete' | null = null;
  validationNote = '';
  validationError = '';
  submitting = false;
  lightboxUrl: string | null = null;

  constructor(private api: ApiService, private route: ActivatedRoute, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      this.filterStatut = p['statut'] ?? '';
      this.load();
    });
  }

  load() {
    this.loading = true;
    const params: any = { page: this.currentPage, size: this.pageSize, sort: 'createdAt,desc' };
    if (this.filterStatut) params['statut'] = this.filterStatut;
    this.api.getDossiersAgent(params).subscribe({
      next: (page) => {
        this.dossiers = page.content;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  prendreEnCharge(d: Dossier) {
    this.api.prendreEnCharge(d.id).subscribe(() => this.load());
  }

  openValidation(d: Dossier) {
    this.selectedDossier = d;
    this.decision = null;
    this.validationNote = '';
    this.validationError = '';
    if (d.documents) {
      d.documents.forEach((doc: any) => {
        if (this.isImage(doc.contentType)) {
          this.loadImage(doc.id);
        }
      });
    }
  }

  submitValidation() {
    if (!this.selectedDossier || !this.decision) return;
    this.submitting = true;
    const payload: any = {
      approuve: this.decision === 'approve',
      note: this.validationNote || undefined,
      messageCompletion: this.decision === 'incomplete' ? this.validationNote : undefined
    };
    this.api.validerDossier(this.selectedDossier.id, payload).subscribe({
      next: () => { this.submitting = false; this.selectedDossier = null; this.load(); },
      error: (err) => { this.submitting = false; this.validationError = err.error?.message || 'Erreur.'; }
    });
  }

  // ── Gestion images ──────────────────────────────────────────
  imageCache: Map<number, string> = new Map();   // public pour template
  imageLoading: Set<number> = new Set();

  getFileUrl(docId: number): string {
    return `${environment.apiUrl}/agent/documents/${docId}/fichier`;
  }

  // Appelé par le template : retourne l'URL blob ou '' si pas encore chargée
  getImageSrc(docId: number): string {
    return this.imageCache.get(docId) || '';
  }

  // Précharge une image via HttpClient (avec token JWT)
  loadImage(docId: number): void {
    if (this.imageCache.has(docId) || this.imageLoading.has(docId)) return;
    this.imageLoading.add(docId);
    this.http.get(this.getFileUrl(docId), { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imageCache.set(docId, objectUrl);
        this.imageLoading.delete(docId);
        this.cdr.detectChanges(); // forcer Angular à re-render
      },
      error: () => {
        this.imageLoading.delete(docId);
        this.cdr.detectChanges();
      }
    });
  }

  isImage(contentType: string): boolean {
    return contentType?.startsWith('image/') ?? false;
  }

  // Ouvrir lightbox : charge d'abord si besoin
  openImage(doc: any): void {
    if (!this.isImage(doc.contentType)) return;
    const cached = this.imageCache.get(doc.id);
    if (cached) {
      this.lightboxUrl = cached;
    } else {
      // Charger et ouvrir quand c'est prêt
      this.imageLoading.add(doc.id);
      this.http.get(this.getFileUrl(doc.id), { responseType: 'blob' }).subscribe({
        next: (blob: Blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.imageCache.set(doc.id, objectUrl);
          this.imageLoading.delete(doc.id);
          this.lightboxUrl = objectUrl;
          this.cdr.detectChanges();
        },
        error: () => {
          this.imageLoading.delete(doc.id);
          alert('Impossible de charger l\'image.');
        }
      });
    }
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      parent.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;color:var(--gray-300);font-size:1.8rem"><span>🖼️</span><span style="font-size:0.65rem;margin-top:4px">Image</span></div>';
    }
  }

  getDocTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      VISITE_MEDICALE: '🩺 Consultation',
      ORDONNANCE:      '💊 Ordonnance',
      SCANNER:         '🧲 Scanner / IRM',
      ANALYSE:         '🔬 Analyse laboratoire',
      RADIO:           '🦴 Radiographie',
      AUTRE:           '📄 Autre document',
      FACTURE:         '🧾 Facture',
    };
    return labels[type] || type;
  }

  /**
   * Parse le texte resultatIA et extrait un champ précis.
   * field: 'prestataire' | 'total' | 'remboursement'
   */
  getAnalyseField(resultatIA: string | null, field: 'prestataire' | 'total' | 'remboursement'): string {
    if (!resultatIA) return '';
    const lines = resultatIA.split(/\n|;/).map(l => l.trim()).filter(l => l);
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (field === 'prestataire' && lower.includes('prestataire')) {
        return line.split(':').slice(1).join(':').trim();
      }
      if (field === 'total' && lower.startsWith('total')) {
        return line.split(':').slice(1).join(':').trim();
      }
      if (field === 'remboursement' && lower.includes('remboursement')) {
        return line.split(':').slice(1).join(':').trim();
      }
    }
    return '';
  }

  goPage(p: number) { this.currentPage = p; this.load(); }
  getPages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }
}