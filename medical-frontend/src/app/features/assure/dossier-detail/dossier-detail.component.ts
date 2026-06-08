import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../core/services/api.service';
import { Dossier, TypeSoin } from '../../../core/models/models';
import {
  StatusLabelPipe, StatusClassPipe,
  Currency2Pipe, ShortDatePipe, DocTypeLabelPipe
} from '../../../shared/pipes/shared.pipes';
import { environment } from '../../../../environments/environment';

interface DocCat {
  key: string; label: string; icon: string; hint: string;
  files: File[]; previews: (string | null)[];
  uploading: boolean; uploaded: boolean; error: string;
}

@Component({
  selector: 'app-dossier-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink,
    StatusLabelPipe, StatusClassPipe, Currency2Pipe, ShortDatePipe, DocTypeLabelPipe],
  template: `
  <div style="max-width:820px">

    <a routerLink="/assure/dossiers" class="back-link">← Retour aux dossiers</a>

    @if (loading) {
      <div class="loading-row"><div class="spin-sm"></div> Chargement...</div>
    }

    @if (dossier) {

      <!-- HEADER DOSSIER -->
      <div class="dossier-header">
        <div>
          <div class="dh-num">{{ dossier.numeroDossier }}</div>
          <span [class]="dossier.statut | statusClass">{{ dossier.statut | statusLabel }}</span>
        </div>
        <div>
          @if ((dossier.statut === 'BROUILLON' || dossier.statut === 'INCOMPLET') && dossier.documents.length > 0) {
            <button class="btn btn-primary" (click)="soumettre()" [disabled]="submitting">
              @if (submitting) { ⏳ Envoi... } @else { 📤 Soumettre le dossier }
            </button>
          }
        </div>
      </div>

      <!-- MESSAGES AGENT -->
      @if (dossier.messageAgent) {
        <div class="msg-card msg-warning">💬 <div><strong>Message de votre agent</strong><br>{{ dossier.messageAgent }}</div></div>
      }
      @if (dossier.noteRejet) {
        <div class="msg-card msg-danger">❌ <div><strong>Motif de rejet</strong><br>{{ dossier.noteRejet }}</div></div>
      }

      <!-- NOTE DOSSIER -->
      <div class="card" style="margin-bottom:14px">
        <div class="card-header">
          <span class="card-title">📝 Détails & Description</span>
          @if (!editNote && (dossier.statut === 'BROUILLON' || dossier.statut === 'INCOMPLET')) {
            <button class="btn btn-sm btn-secondary" (click)="startNote()">
              ✏️ Modifier
            </button>
          }
        </div>
        <div class="card-body">
          @if (editNote) {
            <div style="margin-bottom: 10px;">
              <label class="field-label">Type de Soin</label>
              <select class="form-control" [(ngModel)]="typeSoinValue">
                <option value="">-- Sélectionnez un type --</option>
                @for (ts of typeSoinsOptions; track ts.key) {
                  <option [value]="ts.key">{{ ts.label }}</option>
                }
              </select>
            </div>

            <label class="field-label">Note / Description</label>
            <textarea class="form-control" [(ngModel)]="noteValue" rows="3" placeholder="Décrivez votre demande..."></textarea>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
              <button class="btn btn-sm btn-secondary" (click)="editNote=false">Annuler</button>
              <button class="btn btn-sm btn-primary" (click)="saveNote()" [disabled]="savingNote">
                {{ savingNote ? 'Enregistrement...' : '✓ Enregistrer' }}
              </button>
            </div>
          } @else {
            <div class="meta-item" style="margin-bottom:8px">
              <span class="meta-lbl">Type de Soin</span>
              <span class="meta-val" style="color:var(--primary)">{{ typeSoinLabel(dossier.typeSoin) || 'Non défini' }}</span>
            </div>

            <p style="font-size:0.875rem;color:var(--gray-600);margin:0;line-height:1.6">
              {{ dossier.description || 'Aucune note.' }}
            </p>
          }
          <div class="meta-row">
            <div class="meta-item"><span class="meta-lbl">Créé le</span><span class="meta-val">{{ dossier.createdAt | shortDate }}</span></div>
            @if (dossier.dateSoumission) {
              <div class="meta-item"><span class="meta-lbl">Soumis le</span><span class="meta-val">{{ dossier.dateSoumission | shortDate }}</span></div>
            }
            @if (dossier.montantTotal) {
              <div class="meta-item"><span class="meta-lbl">Montant demandé</span><span class="meta-val">{{ dossier.montantTotal | currency2 }}</span></div>
            }
            @if (dossier.statut === 'APPROUVE' && dossier.montantRembourse) {
              <div class="meta-item"><span class="meta-lbl">Remboursé</span><span class="meta-val" style="color:var(--success)">{{ dossier.montantRembourse | currency2 }}</span></div>
            }
          </div>
        </div>
      </div>

      <!-- DOCUMENTS SOUMIS -->
      @if (dossier.documents.length > 0) {
        <div class="card" style="margin-bottom:14px">
          <div class="card-header">
            <span class="card-title">📂 Documents soumis ({{ dossier.documents.length }})</span>
            <!-- TOTAL REMBOURSEMENT -->
            @if (totalRembourse() > 0) {
              <div class="total-badge">
                💚 Total remboursement estimé : <strong>{{ totalRembourse() | currency2 }}</strong>
              </div>
            }
          </div>
          <div style="padding:0">
            @for (doc of dossier.documents; track doc.id) {
              <div class="doc-card">

                <!-- En-tête document -->
                <div class="doc-card-header">
                  <div class="doc-file-ico">{{ getDocIcon(doc.contentType) }}</div>
                  <div style="flex:1;min-width:0">
                    <div class="doc-name">{{ doc.nomFichier }}</div>
                    <div class="doc-type-label">{{ doc.type | docTypeLabel }}</div>
                  </div>
                  <span class="ia-chip"
                    [class.ia-chip-ok]="doc.statutIA==='VALIDE'"
                    [class.ia-chip-ko]="doc.statutIA==='INVALIDE'||doc.statutIA==='ERREUR'"
                    [class.ia-chip-wait]="doc.statutIA==='EN_ATTENTE'">
                    @if (doc.statutIA === 'EN_ATTENTE') {
                      <span class="mini-spin"></span> Analyse IA...
                    } @else if (doc.statutIA === 'VALIDE') {
                      ✅ Validée
                    } @else if (doc.statutIA === 'INVALIDE') {
                      ❌ Invalide
                    } @else if (doc.statutIA === 'ERREUR') {
                      ⚠️ Erreur
                    }
                  </span>
                </div>

                <!-- ALERTE TYPE INCOHÉRENT -->
                @if (doc.typeDetecteIA && doc.typeDetecteIA !== doc.type) {
                  <div class="alert alert-warning" style="margin-bottom:8px;font-size:0.8rem;padding:6px 10px;">
                    ⚠️ L'IA a détecté qu'il s'agit d'un document de type <strong>{{ doc.typeDetecteIA | docTypeLabel }}</strong>, alors qu'il a été déclaré comme <strong>{{ doc.type | docTypeLabel }}</strong>.
                  </div>
                }

                @if (doc.analyseIA?.besoin_verification) {
                  <div class="alert alert-warning" style="margin-bottom:8px;font-size:0.8rem;padding:6px 10px;">
                    🔍 L'IA a des doutes sur ce document ou demande une vérification manuelle.
                  </div>
                }
                @if (doc.analyseIA?.anomalies?.length > 0) {
                  <div class="alert alert-danger" style="margin-bottom:8px;font-size:0.8rem;padding:6px 10px;">
                    ⚠️ Incohérences signalées par l'IA :
                    <ul style="margin:2px 0 0 20px;padding:0">
                      @for (ano of doc.analyseIA.anomalies; track ano) {
                        <li>{{ ano }}</li>
                      }
                    </ul>
                  </div>
                }

                <!-- Résultat IA — VALIDE -->
                @if (doc.statutIA === 'VALIDE' && doc.analyseIA) {
                  <div class="ia-detail ia-detail-ok">

                    <!-- Ligne 1 : Prestataire + Patient -->
                    <div class="ia-grid-2">
                      @if (doc.analyseIA.prestataire?.nom) {
                        <div class="ia-section">
                          <div class="ia-section-title">🏥 Établissement</div>
                          <div class="ia-val">{{ doc.analyseIA.prestataire.nom }}</div>
                          @if (doc.analyseIA.prestataire?.medecin) {
                            <div class="ia-sub">Dr {{ doc.analyseIA.prestataire.medecin }}
                              @if (doc.analyseIA.prestataire?.specialite) { — {{ doc.analyseIA.prestataire.specialite }} }
                            </div>
                          }
                          @if (doc.analyseIA.prestataire?.telephone) {
                            <div class="ia-sub">📞 {{ doc.analyseIA.prestataire.telephone }}</div>
                          }
                          @if (doc.analyseIA.prestataire?.adresse) {
                            <div class="ia-sub">📍 {{ doc.analyseIA.prestataire.adresse }}</div>
                          }
                        </div>
                      }
                      @if (doc.analyseIA.patient?.nom) {
                        <div class="ia-section">
                          <div class="ia-section-title">👤 Patient</div>
                          <div class="ia-val">{{ doc.analyseIA.patient.nom }}</div>
                          @if (doc.analyseIA.patient?.date_naissance) {
                            <div class="ia-sub">🗓️ {{ doc.analyseIA.patient.date_naissance }}</div>
                          }
                          @if (doc.analyseIA.patient?.numero_assurance) {
                            <div class="ia-sub">🪪 N° {{ doc.analyseIA.patient.numero_assurance }}</div>
                          }
                        </div>
                      }
                    </div>

                    <!-- Ligne 2 : Numéro facture + Date -->
                    @if (doc.analyseIA.facture?.numero || doc.analyseIA.facture?.date || doc.analyseIA.facture?.date_soins) {
                      <div class="ia-grid-3">
                        @if (doc.analyseIA.facture?.numero) {
                          <div class="ia-cell">
                            <div class="ia-cell-lbl">N° Facture</div>
                            <div class="ia-cell-val">{{ doc.analyseIA.facture.numero }}</div>
                          </div>
                        }
                        @if (doc.analyseIA.facture?.date) {
                          <div class="ia-cell">
                            <div class="ia-cell-lbl">Date facture</div>
                            <div class="ia-cell-val">{{ doc.analyseIA.facture.date }}</div>
                          </div>
                        }
                        @if (doc.analyseIA.facture?.date_soins) {
                          <div class="ia-cell">
                            <div class="ia-cell-lbl">Date soins</div>
                            <div class="ia-cell-val">{{ doc.analyseIA.facture.date_soins }}</div>
                          </div>
                        }
                      </div>
                    }

                    <!-- Actes médicaux -->
                    @if (doc.analyseIA.facture?.actes && doc.analyseIA.facture.actes.length > 0) {
                      <div class="ia-section" style="margin-top:8px">
                        <div class="ia-section-title">🔹 Actes médicaux</div>
                        <div class="actes-list">
                          @for (acte of doc.analyseIA.facture.actes; track acte.libelle) {
                            <div class="acte-row">
                              <span class="acte-label">{{ acte.libelle }}</span>
                              @if (acte.montant) {
                                <span class="acte-montant">{{ acte.montant | currency2 }}</span>
                              }
                            </div>
                          }
                        </div>
                      </div>
                    }

                    <!-- Montants -->
                    <div class="montants-grid">
                      @if (doc.analyseIA.facture?.montant_ht) {
                        <div class="montant-cell">
                          <div class="montant-lbl">Montant HT</div>
                          <div class="montant-val">{{ doc.analyseIA.facture.montant_ht | currency2 }}</div>
                        </div>
                      }
                      @if (doc.analyseIA.facture?.tva) {
                        <div class="montant-cell">
                          <div class="montant-lbl">TVA</div>
                          <div class="montant-val">{{ doc.analyseIA.facture.tva | currency2 }}</div>
                        </div>
                      }
                      @if (doc.analyseIA.facture?.montant_ttc) {
                        <div class="montant-cell montant-ttc">
                          <div class="montant-lbl">Total TTC</div>
                          <div class="montant-val">{{ doc.analyseIA.facture.montant_ttc | currency2 }}</div>
                        </div>
                      }
                      @if (doc.analyseIA.remboursement?.montant_rembourse) {
                        <div class="montant-cell montant-remb">
                          <div class="montant-lbl">Remboursement ({{ doc.analyseIA.remboursement.taux_applique * 100 | number:'1.0-0' }}%)</div>
                          <div class="montant-val remb-val">{{ doc.analyseIA.remboursement.montant_rembourse | currency2 }}</div>
                        </div>
                      }
                    </div>

                    <div class="ia-score">📊 Confiance IA : {{ (doc.analyseIA.score_confiance * 100) | number:'1.0-0' }}%</div>
                  </div>
                }

                <!-- Résultat IA — INVALIDE -->
                @if (doc.statutIA === 'INVALIDE' || doc.statutIA === 'ERREUR') {
                  <div class="ia-detail ia-detail-ko">
                    @if (doc.resultatIA) { {{ doc.resultatIA }} }
                    @else { Document non reconnu comme facture médicale valide. }
                  </div>
                }

              </div>
            }
          </div>
        </div>
      }

      <!-- BOUTON AJOUTER DOCUMENT -->
      @if (dossier.statut === 'BROUILLON' || dossier.statut === 'INCOMPLET') {
        <div class="card" style="margin-bottom:14px">
          <div class="card-header">
            <span class="card-title">📎 Documents médicaux</span>
            <button class="btn btn-sm btn-primary" (click)="showModal=true">＋ Ajouter un document</button>
          </div>
          <div class="card-body">
            <p style="font-size:0.82rem;color:var(--gray-400);margin:0">
              @if (dossier.documents.length === 0) { Aucun document. Cliquez sur "＋ Ajouter un document". }
              @else { {{ dossier.documents.length }} document(s) — cliquez pour en ajouter d'autres. }
            </p>
          </div>
        </div>
      }
    }

   @if (showModal) {
  <div class="modal-overlay" (click)="showModal=false">
    <div class="modal" (click)="$event.stopPropagation()" style="max-width:620px;max-height:88vh;overflow-y:auto">
      
      <div class="modal-header">
        <span class="modal-title">Ajouter un document médical</span>
        <button class="btn btn-icon btn-secondary" (click)="showModal=false">✕</button>
      </div>

      <div class="modal-body">
        <div class="field-label" style="margin-top:18px">
          1. Sélectionnez le type de document
          <span class="opt-hint">(aucun champ obligatoire)</span>
        </div>

        <div class="cats-list">
          @for (cat of docCats; track cat.key) {
            <div class="cat-item" [class.cat-done]="cat.uploaded && cat.files.length === 0">
              
              <div class="cat-row">
                <span class="cat-ico">{{ cat.icon }}</span>
                <div style="flex:1">
                  <div class="cat-name">{{ cat.label }}</div>
                  <div class="cat-hint">{{ cat.hint }}</div>
                </div>
                
                @if (cat.uploaded) {
                  <span style="font-size:1.1rem">✅</span>
                  <button class="btn btn-sm btn-secondary" 
                          style="margin-left:8px;font-size:0.72rem"
                          (click)="cat.uploaded = false; cat.files = []; cat.previews = []">
                    ＋ Ajouter un autre
                  </button>
                }
              </div>

              @if (cat.previews && cat.previews.length > 0) {
                <div class="preview-wrap">
                  <img [src]="cat.previews[0]" alt="preview" />
                  <button class="preview-rm" (click)="removeFile(cat, cat.files[0])">✕</button>
                </div>
              }

              <label class="drop-zone" [class.has-file]="cat.files && cat.files.length > 0">
                <input type="file" accept="image/*,.pdf" (change)="onFile($event,cat)" multiple hidden />
                
                @if (cat.files && cat.files.length > 0) {
                  <div style="display:flex;flex-direction:column;gap:6px;">
                    @for (f of cat.files; track f.name) {
                      <div class="dz-selected">
                        📄 {{ f.name }} 
                        <span>({{ (f.size/1024)|number:'1.0-0' }} Ko)</span>
                        <button class="preview-rm" (click)="removeFile(cat,f)" style="margin-left:8px;">✕</button>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="dz-empty">
                    <span>＋</span>
                    @if (cat.uploaded) {
                      Ajouter un autre fichier pour ce type
                    } @else {
                      Cliquez ou déposez une image / PDF (vous pouvez en ajouter plusieurs)
                    }
                  </div>
                }
              </label>

              @if (cat.files && cat.files.length > 0) {
                <button class="btn btn-primary btn-sm" 
                        style="width:100%;margin-top:6px;display:flex;align-items:center;justify-content:center;gap:6px"
                        (click)="upload(cat)" [disabled]="cat.uploading">
                  @if (cat.uploading) { 
                    <span class="btn-spin"></span> Analyse IA en cours... 
                  } @else { 
                    📤 Envoyer les fichiers pour analyse IA 
                  }
                </button>
              }

              @if (cat.error) {
                <div class="alert alert-danger" style="margin-top:6px;font-size:0.78rem">
                  ⚠️ {{ cat.error }}
                </div>
              }

            </div>
          }
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" (click)="showModal=false">Fermer</button>
      </div>

    </div>
  </div>
}
  </div>
  `,
  styles: [`
    .back-link { display:inline-block; font-size:0.82rem; color:var(--gray-500); text-decoration:none; margin-bottom:16px; }
    .back-link:hover { color:var(--primary); }
    .loading-row { display:flex; align-items:center; gap:8px; font-size:0.875rem; color:var(--gray-500); padding:20px; background:white; border-radius:var(--radius-md); }
    .spin-sm { width:16px; height:16px; border:2px solid var(--gray-200); border-top-color:var(--primary); border-radius:50%; animation:spin 0.6s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .dossier-header { display:flex; justify-content:space-between; align-items:center; background:var(--sidebar-bg); border-radius:var(--radius-lg); padding:18px 20px; margin-bottom:14px; }
    .dh-num { font-family:monospace; font-size:1rem; font-weight:700; color:white; margin-bottom:6px; }
    .msg-card { display:flex; gap:10px; align-items:flex-start; border-radius:var(--radius-md); padding:12px 16px; margin-bottom:12px; font-size:0.875rem; }
    .msg-warning { background:var(--warning-bg); border:1.5px solid #fde68a; color:#92400e; }
    .msg-danger  { background:var(--danger-bg);  border:1.5px solid #fca5a5; color:#991b1b; }

    .meta-row { display:flex; gap:20px; flex-wrap:wrap; margin-top:12px; padding-top:10px; border-top:1px solid var(--gray-100); }
    .meta-item { display:flex; flex-direction:column; gap:2px; }
    .meta-lbl { font-size:0.62rem; color:var(--gray-400); font-weight:700; text-transform:uppercase; }
    .meta-val { font-size:0.875rem; font-weight:700; color:var(--gray-800); }

    .total-badge { background:var(--success-bg); border:1px solid var(--success); color:#166534; padding:5px 12px; border-radius:var(--radius); font-size:0.82rem; }

    /* Doc cards */
    .doc-card { border-bottom:1px solid var(--gray-100); padding:14px 16px; }
    .doc-card:last-child { border-bottom:none; }
    .doc-card-header { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
    .doc-file-ico { font-size:1.4rem; flex-shrink:0; }
    .doc-name { font-size:0.875rem; font-weight:600; color:var(--gray-800); }
    .doc-type-label { font-size:0.72rem; color:var(--gray-400); margin-top:2px; }
    .ia-chip { font-size:0.72rem; font-weight:700; padding:3px 10px; border-radius:99px; white-space:nowrap; display:flex; align-items:center; gap:4px; background:var(--gray-100); color:var(--gray-500); }
    .ia-chip-ok   { background:var(--success-bg); color:var(--success); }
    .ia-chip-ko   { background:var(--danger-bg);  color:var(--danger);  }
    .ia-chip-wait { background:var(--warning-bg); color:var(--warning); }
    .mini-spin { display:inline-block; width:10px; height:10px; border:1.5px solid currentColor; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; }

    /* IA detail block */
    .ia-detail { margin-top:4px; padding:12px 14px; border-radius:var(--radius-md); font-size:0.82rem; line-height:1.5; }
    .ia-detail-ok  { background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; }
    .ia-detail-ko  { background:var(--danger-bg); border:1px solid #fca5a5; color:#991b1b; white-space:pre-line; }

    .ia-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px; }
    .ia-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:10px; }
    .ia-section { }
    .ia-section-title { font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#166534; opacity:0.7; margin-bottom:3px; }
    .ia-val { font-weight:700; font-size:0.85rem; color:#166534; }
    .ia-sub { font-size:0.75rem; color:#166534; opacity:0.8; }
    .ia-cell { background:rgba(255,255,255,0.6); border-radius:var(--radius-sm); padding:6px 10px; }
    .ia-cell-lbl { font-size:0.65rem; font-weight:700; text-transform:uppercase; color:#166534; opacity:0.65; }
    .ia-cell-val { font-size:0.85rem; font-weight:700; color:#166534; }

    .actes-list { display:flex; flex-direction:column; gap:4px; margin-top:4px; }
    .acte-row { display:flex; justify-content:space-between; padding:4px 8px; background:rgba(255,255,255,0.5); border-radius:4px; font-size:0.78rem; }
    .acte-label { color:#166534; }
    .acte-montant { font-weight:700; color:#166534; }

    .montants-grid { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; padding-top:8px; border-top:1px solid rgba(22,101,52,0.15); }
    .montant-cell { background:rgba(255,255,255,0.6); border-radius:var(--radius-sm); padding:6px 12px; min-width:100px; }
    .montant-cell.montant-ttc { background:rgba(255,255,255,0.9); }
    .montant-cell.montant-remb { background:#dcfce7; }
    .montant-lbl { font-size:0.65rem; font-weight:700; text-transform:uppercase; color:#166534; opacity:0.65; margin-bottom:2px; }
    .montant-val { font-size:0.9rem; font-weight:700; color:#166534; }
    .remb-val { font-size:1rem; color:#15803d; }
    .ia-score { font-size:0.72rem; color:#166534; opacity:0.65; margin-top:8px; }

    /* Upload modal */
    .field-label { font-size:0.72rem; font-weight:700; color:var(--gray-500); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:8px; }
    .opt-hint { font-size:0.68rem; color:var(--gray-400); font-weight:400; font-style:italic; margin-left:6px; text-transform:none; }
    .remb-grid { display:flex; gap:8px; flex-wrap:wrap; }
    .remb-btn { display:flex; align-items:center; gap:8px; padding:10px 14px; border:1.5px solid var(--gray-200); border-radius:var(--radius-md); background:var(--gray-50); cursor:pointer; font-family:var(--font-sans); transition:all 0.15s; flex:1; min-width:130px; }
    .remb-btn:hover { border-color:var(--primary-100); background:var(--primary-50); }
    .remb-btn.remb-active { border-color:var(--primary); background:var(--primary-50); }
    .remb-name { font-size:0.82rem; font-weight:700; color:var(--gray-800); }
    .remb-hint { font-size:0.68rem; color:var(--gray-400); }
    .cats-list { display:flex; flex-direction:column; gap:10px; }
    .cat-item { border:1.5px solid var(--gray-200); border-radius:var(--radius-md); padding:12px 14px; }
    .cat-item.cat-done { border-color:var(--success); background:var(--success-bg); }
    .cat-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
    .cat-ico { font-size:1.5rem; flex-shrink:0; }
    .cat-name { font-size:0.875rem; font-weight:700; color:var(--gray-800); }
    .cat-hint { font-size:0.72rem; color:var(--gray-400); }
    .preview-wrap { position:relative; margin-bottom:8px; }
    .preview-wrap img { width:100%; max-height:150px; object-fit:cover; border-radius:var(--radius); border:1px solid var(--gray-200); }
    .preview-rm { position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.5); color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; font-size:0.6rem; display:flex; align-items:center; justify-content:center; }
    .drop-zone { display:flex; align-items:center; justify-content:center; border:2px dashed var(--gray-200); border-radius:var(--radius); padding:12px; cursor:pointer; transition:all 0.15s; }
    .drop-zone:hover, .drop-zone.has-file { border-color:var(--primary); background:var(--primary-50); }
    .dz-empty { display:flex; flex-direction:column; align-items:center; gap:4px; color:var(--gray-400); font-size:0.78rem; }
    .dz-selected { font-size:0.82rem; font-weight:600; color:var(--primary); }
    .btn-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:white; border-radius:50%; animation:spin 0.6s linear infinite; display:inline-block; }
  `]
})
export class DossierDetailComponent implements OnInit {

  dossier: Dossier | null = null;
  loading = true;
  submitting = false;
  editNote = false;
  noteValue = '';
  savingNote = false;
  showModal = false;


  typeSoinValue: TypeSoin | '' = '';
  typeSoinsOptions: { key: TypeSoin, label: string }[] = [
    { key: 'CONSULTATION', label: 'Consultation' },
    { key: 'HOSPITALISATION', label: 'Hospitalisation' },
    { key: 'DENTAIRE', label: 'Soins Dentaires' },
    { key: 'OPTIQUE', label: 'Optique' },
    { key: 'ALD', label: 'Maladie Chronique (ALD)' },
    { key: 'PHARMACIE', label: 'Pharmacie' },
    { key: 'AUTRE', label: 'Autre' }
  ];

  allDocCats: DocCat[] = [
    { key: 'ORDONNANCE', label: 'Ordonnance', icon: '💊', hint: 'Prescription médicale, médicaments', files: [], previews: [], uploading: false, uploaded: false, error: '' },
    { key: 'FACTURE_PHARMACIE', label: 'Facture Pharmacie', icon: '🧾', hint: 'Achat de médicaments', files: [], previews: [], uploading: false, uploaded: false, error: '' },
    { key: 'FACTURE_RADIO', label: 'Facture Radio', icon: '🦴', hint: 'Frais de radiologie', files: [], previews: [], uploading: false, uploaded: false, error: '' },
    { key: 'FACTURE_SCANNER', label: 'Facture Scanner', icon: '🧲', hint: 'Frais de scanner', files: [], previews: [], uploading: false, uploaded: false, error: '' },
    { key: 'FACTURE_LABO', label: 'Facture Laboratoire', icon: '🔬', hint: 'Frais d\'analyses médicales', files: [], previews: [], uploading: false, uploaded: false, error: '' },
    { key: 'FACTURE_IRM', label: 'Facture IRM', icon: '🧲', hint: 'Frais d\'IRM', files: [], previews: [], uploading: false, uploaded: false, error: '' },
    { key: 'BULLETIN_SORTIE', label: 'Bulletin de sortie', icon: '🏥', hint: 'Hospitalisation', files: [], previews: [], uploading: false, uploaded: false, error: '' },
    { key: 'FACTURE', label: 'Facture', icon: '🧾', hint: 'Facture générale (Clinique, Dentiste...)', files: [], previews: [], uploading: false, uploaded: false, error: '' },
    { key: 'SCANNER', label: 'Compte-rendu Scanner', icon: '🧲', hint: 'Imagerie médicale', files: [], previews: [], uploading: false, uploaded: false, error: '' },
    { key: 'ANALYSE', label: 'Résultats d\'analyse', icon: '🔬', hint: 'Analyses sanguines, urinaires...', files: [], previews: [], uploading: false, uploaded: false, error: '' },
    { key: 'RADIO', label: 'Compte-rendu Radiographie', icon: '🦴', hint: 'Radio pulmonaire, dentaire, osseuse...', files: [], previews: [], uploading: false, uploaded: false, error: '' },
    { key: 'AUTRE', label: 'Autre document médical', icon: '📄', hint: 'Tout autre justificatif', files: [], previews: [], uploading: false, uploaded: false, error: '' },
  ];

  get docCats(): DocCat[] {
    if (!this.dossier?.typeSoin) return this.allDocCats;
    const mapping: Record<string, string[]> = {
      'CONSULTATION': ['ORDONNANCE', 'FACTURE_PHARMACIE', 'FACTURE_RADIO', 'FACTURE_SCANNER', 'FACTURE_LABO', 'FACTURE_IRM', 'AUTRE'],
      'HOSPITALISATION': ['FACTURE', 'BULLETIN_SORTIE', 'ORDONNANCE', 'AUTRE'],
      'OPTIQUE': ['FACTURE', 'ORDONNANCE', 'AUTRE'],
      'ALD': ['ORDONNANCE', 'FACTURE_PHARMACIE', 'FACTURE_RADIO', 'FACTURE_SCANNER', 'FACTURE_LABO', 'FACTURE_IRM', 'AUTRE'],
      'DENTAIRE': ['FACTURE', 'RADIO', 'AUTRE']
    };
    const req = mapping[this.dossier.typeSoin] || ['AUTRE'];
    return this.allDocCats.filter(c => req.includes(c.key));
  }

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDossier(id);
  }

  private loadDossier(id: number): void {
    this.api.getDossier(id).subscribe({
      next: (d) => {
        this.dossier = d;
        this.noteValue = d.description || '';
        this.typeSoinValue = d.typeSoin || '';

        this.loading = false;
        // Réinitialiser les statuts d'upload pour le nouveau dossier
        this.allDocCats.forEach(c => c.uploaded = false);
        // Marquer les catégories déjà uploadées
        d.documents.forEach((doc: any) => {
          const cat = this.allDocCats.find(c => c.key === doc.type);
          if (cat) cat.uploaded = true;
        });
        // Relancer le polling pour les docs encore EN_ATTENTE
        d.documents
          .filter((doc: any) => doc.statutIA === 'EN_ATTENTE')
          .forEach((doc: any) => this.pollDoc(doc.id));
      },
      error: () => { this.loading = false; }
    });
  }

  // ── Note ─────────────────────────────────────────────────────
  startNote(): void {
    this.noteValue = this.dossier?.description || '';
    this.typeSoinValue = this.dossier?.typeSoin || '';
    this.editNote = true;
  }

  saveNote(): void {
    if (!this.dossier) return;
    this.savingNote = true;
    this.http.put<any>(`${environment.apiUrl}/assure/dossiers/${this.dossier.id}`,
      {
        description: this.noteValue,
        typeSoin: this.typeSoinValue
      }
    ).subscribe({
      next: (d) => {
        if (this.dossier) {
          this.dossier.description = this.noteValue;
          this.dossier.typeSoin = this.typeSoinValue as TypeSoin;
        }
        this.savingNote = false;
        this.editNote = false;
      },
      error: () => {
        // En cas d'erreur de réseau mais qu'on a déjà simulé
        this.savingNote = false;
        this.editNote = false;
      }
    });
  }

  // ── Fichier ───────────────────────────────────────────────────
  onFile(event: Event, cat: DocCat): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    cat.error = '';
    const files = Array.from(input.files);
    files.forEach(f => {
      cat.files.push(f);
      if (f.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => { cat.previews.push(e.target?.result as string); };
        reader.readAsDataURL(f);
      } else {
        cat.previews.push(null);
      }
    });
    // Reset input value so same file can be re-selected if needed
    input.value = '';
  }

  removeFile(cat: DocCat, item: number | File): void {
    if (!cat.files) return;
    let index = -1;
    if (typeof item === 'number') index = item;
    else index = cat.files.indexOf(item as File);
    if (index < 0 || index >= cat.files.length) return;
    cat.files.splice(index, 1);
    cat.previews.splice(index, 1);
    cat.error = '';
  }

  upload(cat: DocCat): void {
  if (!this.dossier || !cat.files || cat.files.length === 0) return;
  cat.uploading = true;
  cat.error = '';
  const uploads: Promise<void>[] = [];

  for (let i = 0; i < cat.files.length; i++) {
    const f = cat.files[i];
    const fd = new FormData();
    fd.append('fichier', f);
    fd.append('type', cat.key);
    const p = new Promise<void>((resolve, reject) => {
      this.api.uploadDocument(this.dossier!.id, fd).subscribe({
        next: (doc: any) => {
          if (this.dossier) this.dossier.documents.push(doc);
          this.pollDoc(doc.id);
          resolve();
        },
        error: (err: any) => { reject(err); }
      });
    }).catch((err) => {
      cat.error = err?.error?.message || 'Erreur lors de l\'upload.';
    });
    uploads.push(p);
  }

  Promise.all(uploads).then(() => {
    cat.uploading = false;
    // ✅ CORRECTION : marquer uploaded mais vider les fichiers
    // pour permettre d'en ajouter d'autres
    if (cat.error === '') {
      cat.uploaded = true;
    }
    // ✅ Toujours vider les fichiers sélectionnés après upload
    cat.files = [];
    cat.previews = [];
  }).catch(() => {
    cat.uploading = false;
  });
}

  // ── Polling IA (toutes les 3s, max 45s) ──────────────────────
  private pollDoc(docId: number): void {
    let tries = 0;
    const iv = setInterval(() => {
      tries++;
      if (!this.dossier) { clearInterval(iv); return; }
      this.api.getDossier(this.dossier.id).subscribe({
        next: (fresh: any) => {
          const docFresh = fresh.documents.find((d: any) => d.id === docId);
          if (!docFresh) return;
          const idx = this.dossier!.documents.findIndex(d => d.id === docId);
          if (idx !== -1) this.dossier!.documents[idx] = docFresh;
          const done = ['VALIDE', 'INVALIDE', 'ERREUR'].includes(docFresh.statutIA);
          if (done || tries >= 60) clearInterval(iv);
        },
        error: () => clearInterval(iv)
      });
    }, 3000);
  }

  // ── Soumettre ─────────────────────────────────────────────────
  soumettre(): void {
    if (!this.dossier) return;
    this.submitting = true;
    this.api.soumettreDossier(this.dossier.id).subscribe({
      next: (d) => { this.dossier = d; this.submitting = false; },
      error: () => { this.submitting = false; }
    });
  }

  // ── Total remboursement tous docs validés ────────────────────
  totalRembourse(): number {
    if (!this.dossier) return 0;
    return this.dossier.documents
      .filter((d: any) => d.statutIA === 'VALIDE' && d.analyseIA?.remboursement?.montant_rembourse)
      .reduce((s: number, d: any) => s + (d.analyseIA.remboursement.montant_rembourse || 0), 0);
  }

  // ── Helpers ───────────────────────────────────────────────────
  typeSoinLabel(ts?: string): string {
    if (!ts) return '';
    return this.typeSoinsOptions.find(o => o.key === ts)?.label || ts;
  }



  getDocIcon(ct: string): string {
    if (ct?.includes('pdf')) return '📋';
    if (ct?.includes('image')) return '🖼️';
    return '📄';
  }
}
