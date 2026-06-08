import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Dossier } from '../../../core/models/models';
import { StatusLabelPipe, StatusClassPipe, ShortDatePipe, Currency2Pipe } from '../../../shared/pipes/shared.pipes';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusLabelPipe, StatusClassPipe, ShortDatePipe, Currency2Pipe],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Mon espace agent</h1>
        <p class="page-subtitle">Gérez les dossiers de remboursement</p>
      </div>
      <a class="btn btn-primary" routerLink="/agent/dossiers">Voir tous les dossiers</a>
    </div>

    <!-- Stats -->
    <div class="grid-3" style="margin-bottom: 28px;">
      <div class="stat-card" style="border-left: 3px solid var(--primary);">
        <div class="stat-icon" style="background: var(--primary-50);">📬</div>
        <div class="stat-info">
          <div class="stat-value">{{ dossiersSoumis.length }}</div>
          <div class="stat-label">Dossiers à traiter</div>
        </div>
      </div>
      <div class="stat-card" style="border-left: 3px solid var(--warning);">
        <div class="stat-icon" style="background: var(--warning-bg);">⏳</div>
        <div class="stat-info">
          <div class="stat-value">{{ dossiersEnCours.length }}</div>
          <div class="stat-label">En cours de traitement</div>
        </div>
      </div>
      <div class="stat-card" style="border-left: 3px solid var(--success);">
        <div class="stat-icon" style="background: var(--success-bg);">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ dossiersTraites }}</div>
          <div class="stat-label">Traités</div>
        </div>
      </div>
    </div>

    <!-- Dossiers soumis -->
    <div class="card" style="margin-bottom: 20px;">
      <div class="card-header">
        <span class="card-title">📬 Dossiers soumis — en attente de prise en charge</span>
        <span class="badge badge-primary">{{ dossiersSoumis.length }}</span>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>N° Dossier</th>
              <th>Assuré</th>
              <th>Note</th>
              <th>Soumis le</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            @for (d of dossiersSoumis.slice(0, 5); track d.id) {
              <tr>
                <td><span style="font-family:monospace; font-weight:700; color:var(--primary); font-size:0.8rem;">{{ d.numeroDossier }}</span></td>
                <td>{{ d.assure.prenom }} {{ d.assure.nom }}</td>
                <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.82rem; color:var(--gray-500);">
                  {{ d.description || '—' }}
                </td>
                <td>{{ d.dateSoumission | shortDate }}</td>
                <td>
                  <button class="btn btn-primary btn-sm" (click)="prendreEnCharge(d)" [disabled]="taking === d.id">
                    {{ taking === d.id ? '...' : '▶ Prendre en charge' }}
                  </button>
                </td>
              </tr>
            }
            @if (dossiersSoumis.length === 0) {
              <tr>
                <td colspan="5">
                  <div class="empty-state" style="padding:24px">
                    <div class="empty-icon">🎉</div>
                    <h3>Aucun dossier en attente</h3>
                    <p>Tous les dossiers ont été traités</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mes dossiers en cours -->
    @if (dossiersEnCours.length > 0) {
      <div class="card">
        <div class="card-header">
          <span class="card-title">⏳ Mes dossiers en cours</span>
          <span class="badge badge-warning">{{ dossiersEnCours.length }}</span>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>N° Dossier</th>
                <th>Assuré</th>
                <th>Note</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (d of dossiersEnCours; track d.id) {
                <tr>
                  <td style="font-family:monospace; font-weight:700; color:var(--primary); font-size:0.8rem;">{{ d.numeroDossier }}</td>
                  <td>{{ d.assure.prenom }} {{ d.assure.nom }}</td>
                  <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.82rem; color:var(--gray-500);">
                    {{ d.description || '—' }}
                  </td>
                  <td><span [class]="d.statut | statusClass">{{ d.statut | statusLabel }}</span></td>
                  <td>
                    <button class="btn btn-sm btn-primary" (click)="selectDossier(d)">Traiter ▸</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Modal validation -->
    <!-- LIGHTBOX visionneuse plein écran -->
    @if (lightboxUrl) {
      <div class="lightbox-overlay" (click)="lightboxUrl=null">
        <div class="lightbox-box" (click)="$event.stopPropagation()">
          <button class="lightbox-close" (click)="lightboxUrl=null">✕</button>
          <img [src]="lightboxUrl" alt="Document médical" class="lightbox-img" />
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
                <button [class]="'btn btn-sm ' + (decision === 'approve'    ? 'btn-success'   : 'btn-secondary')" (click)="decision = 'approve'">✅ Approuver</button>
                <button [class]="'btn btn-sm ' + (decision === 'incomplete' ? 'btn-warning'   : 'btn-secondary')" (click)="decision = 'incomplete'">⚠️ Incomplet</button>
                <button [class]="'btn btn-sm ' + (decision === 'reject'     ? 'btn-danger'    : 'btn-secondary')" (click)="decision = 'reject'">❌ Rejeter</button>
              </div>
              @if (decision === 'incomplete') {
                <div class="form-group">
                  <label class="form-label">Message à l'assuré (documents manquants)</label>
                  <textarea class="form-control" [(ngModel)]="validationNote" rows="3" placeholder="Ex: Merci de fournir le reçu original de la consultation..."></textarea>
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
export class AgentDashboardComponent implements OnInit {
  dossiersSoumis: Dossier[] = [];
  dossiersEnCours: Dossier[] = [];
  dossiersTraites = 0;
  taking: number | null = null;
  prenom = '';

  selectedDossier: Dossier | null = null;
  decision: 'approve' | 'reject' | 'incomplete' | null = null;
  validationNote = '';
  validationError = '';
  submitting = false;
  lightboxUrl: string | null = null;

  constructor(private api: ApiService, private auth: AuthService, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.prenom = this.auth.currentUser()?.prenom ?? 'Agent';
    this.loadDossiers();
  }

  loadDossiers() {
    this.api.getDossiersSoumis({ page: 0, size: 20 }).subscribe(p => this.dossiersSoumis = p.content);
    this.api.getDossiersAgent({ statut: 'EN_COURS', page: 0, size: 20 }).subscribe(p => {
      this.dossiersEnCours = p.content;
    });
  }

  prendreEnCharge(d: Dossier) {
    this.taking = d.id;
    this.api.prendreEnCharge(d.id).subscribe({
      next: (updated) => { this.taking = null; this.loadDossiers(); this.selectDossier(updated); },
      error: () => this.taking = null
    });
  }

  selectDossier(d: Dossier) {
    this.selectedDossier = d;
    this.decision = null;
    this.validationNote = '';
    this.validationError = '';
    // Précharger les images des documents
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
    this.validationError = '';
    const payload: any = {
      approuve: this.decision === 'approve',
      note: this.validationNote || undefined,
      messageCompletion: this.decision === 'incomplete' ? this.validationNote : undefined
    };
    this.api.validerDossier(this.selectedDossier.id, payload).subscribe({
      next: () => { this.submitting = false; this.selectedDossier = null; this.loadDossiers(); },
      error: (err) => { this.submitting = false; this.validationError = err.error?.message || 'Erreur lors de la validation.'; }
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
}