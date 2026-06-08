import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/models/models';
import { environment } from '../../../../environments/environment';

type ActiveTab = 'infos' | 'securite' | 'dossiers';

@Component({
  selector: 'app-assure-profil',
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
            <span class="badge-role">👤 Assuré</span>
            <span class="header-email">{{ user?.email }}</span>
          </p>
          <p class="header-date">Membre depuis {{ user?.createdAt | date:'MMMM yyyy' : '' : 'fr' }}</p>
        </div>
      </div>

      <!-- Onglets -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'infos'" (click)="setActiveTab('infos')">
          📋 Mes informations
        </button>
        <button class="tab" [class.active]="activeTab === 'securite'" (click)="setActiveTab('securite')">
          🔒 Sécurité
        </button>
        <button class="tab" [class.active]="activeTab === 'dossiers'" (click)="setActiveTab('dossiers')">
          📁 Mes dossiers
          @if (totalDossiers > 0) {
            <span class="tab-badge">{{ totalDossiers }}</span>
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
                  <input class="form-control" [(ngModel)]="editForm.cin" placeholder="12345678" />
                </div>
                <div class="form-group form-group-full">
                  <label class="form-label">Adresse</label>
                  <input class="form-control" [(ngModel)]="editForm.adresse" placeholder="Votre adresse..." />
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

          <!-- Famille -->
          <div class="card famille-card">
            <div class="card-header">
              <div class="famille-header-left">
                <h3>👨‍👩‍👧 Ma famille</h3>
                <span class="famille-count">{{ familyMembers.length }} membre{{ familyMembers.length !== 1 ? 's' : '' }}</span>
              </div>
              <button class="btn btn-outline btn-sm famille-add-btn" (click)="showAddForm = !showAddForm">
                {{ showAddForm ? '✕ Annuler' : '+ Ajouter un membre' }}
              </button>
            </div>

            <!-- Inline add-member panel -->
            @if (showAddForm) {
              <div class="famille-add-panel">
                <div class="famille-add-grid">
                  <div class="fam-field">
                    <label class="fam-label">Prénom</label>
                    <input class="form-control" placeholder="ex: Amira" [(ngModel)]="newFamilyMember.prenom" />
                  </div>
                  <div class="fam-field">
                    <label class="fam-label">Nom</label>
                    <input class="form-control" placeholder="ex: Ben Ali" [(ngModel)]="newFamilyMember.nom" />
                  </div>
                  <div class="fam-field">
                    <label class="fam-label">Lien de parenté</label>
                    <select class="form-control" [(ngModel)]="newFamilyMember.relation">
                      <option value="">Choisir…</option>
                      <option value="Conjoint">💑 Conjoint(e)</option>
                      <option value="Enfant">🧒 Enfant</option>
                      <option value="Parent">👴 Parent</option>
                      <option value="Frère/Sœur">🤝 Frère / Sœur</option>
                      <option value="Autre">👤 Autre</option>
                    </select>
                  </div>
                  <div class="fam-field">
                    <label class="fam-label">Date de naissance</label>
                    <input type="date" class="form-control" [(ngModel)]="newFamilyMember.dateNaissance" />
                  </div>
                </div>
                @if (familyError) { <div class="alert alert-danger" style="margin-top:10px">⚠️ {{ familyError }}</div> }
                <div class="famille-add-actions">
                  <button class="btn btn-ghost" (click)="showAddForm = false; resetAddForm()">Annuler</button>
                  <button class="btn btn-primary" (click)="ajouterMembre()"
                    [disabled]="!newFamilyMember.prenom || !newFamilyMember.nom || !newFamilyMember.relation">
                    ✅ Confirmer l'ajout
                  </button>
                </div>
              </div>
            }

            <div class="famille-body">
              <!-- Empty state -->
              @if (familyMembers.length === 0 && !showAddForm) {
                <div class="famille-empty-state">
                  <div class="famille-empty-icon">👨‍👩‍👧‍👦</div>
                  <p class="famille-empty-title">Aucun membre ajouté</p>
                  <p class="famille-empty-sub">Ajoutez vos proches pour bénéficier<br/>d'une couverture familiale complète.</p>
                  <button class="btn btn-primary btn-sm" (click)="showAddForm = true">+ Ajouter un membre</button>
                </div>
              }

              <!-- Chip list -->
              @if (familyMembers.length > 0) {
                <div class="family-chips">
                  @for (f of familyMembers; track f.id; let i = $index) {
                    <div class="family-chip" [attr.data-rel]="getRelationKey(f.relation)">
                      <div class="chip-avatar">{{ (f.prenom?.[0] || '') + (f.nom?.[0] || '') | uppercase }}</div>
                      <div class="chip-info">
                        <span class="chip-name">{{ f.prenom }} {{ f.nom }}</span>
                        <span class="chip-badge">{{ f.relation }}</span>
                      </div>
                      <button class="chip-remove" title="Supprimer" (click)="supprimerMembre(f.id)">✕</button>
                    </div>
                  }
                </div>
                <p class="famille-hint">ℹ️ Ces membres peuvent être associés à vos dossiers de remboursement.</p>
              }
            </div>
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
              <button class="btn btn-danger" (click)="authService.logout()">
                ⬅️ Déconnexion
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ===== ONGLET : Mes dossiers ===== -->
      @if (activeTab === 'dossiers') {
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
              <h3>Historique de mes dossiers</h3>
            </div>
            @if (loadingDossiers) {
              <div class="loading-state">
                <div class="spinner-lg"></div>
                <p>Chargement...</p>
              </div>
            } @else if (dossiers.length === 0) {
              <div class="empty-state">
                <div class="empty-icon">📂</div>
                <p>Aucun dossier pour le moment</p>
              </div>
            } @else {
              <div class="dossiers-list">
                @for (d of dossiers; track d.id) {
                  <div class="dossier-row">
                    <div class="dossier-num">{{ d.numeroDossier }}</div>
                    <div class="dossier-info">
                      <div class="dossier-desc">{{ d.description }}</div>
                      <div class="dossier-date">{{ d.createdAt | date:'dd/MM/yyyy' }}</div>
                    </div>
                    <div class="dossier-montant">
                      @if (d.montantRembourse) {
                        <span class="montant-ok">{{ d.montantRembourse | number:'1.2-2' }} TND</span>
                      } @else {
                        <span class="montant-na">—</span>
                      }
                    </div>
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
    .profil-page { max-width: 860px; margin: 0 auto; }

    /* Header */
    .profil-header {
      display: flex; align-items: center; gap: 24px;
      background: linear-gradient(135deg, #0f172a, #1e3a5f);
      border-radius: var(--radius-lg); padding: 32px; margin-bottom: 24px; color: white;
    }
    .avatar-large {
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), #6aa3f8);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; font-weight: 700; color: white; flex-shrink: 0;
      border: 3px solid rgba(255,255,255,0.2);
    }
    .header-info h1 { font-family: 'Fraunces', serif; font-size: 1.75rem; font-weight: 600; margin-bottom: 6px; }
    .header-role { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .badge-role { background: rgba(255,255,255,0.15); padding: 3px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
    .header-email { font-size: 0.875rem; opacity: 0.7; }
    .header-date { font-size: 0.8rem; opacity: 0.5; }

    /* Tabs */
    .tabs { display: flex; gap: 4px; margin-bottom: 20px; background: var(--gray-100); padding: 4px; border-radius: var(--radius-md); }
    .tab {
      flex: 1; padding: 10px 16px; border: none; background: none; border-radius: var(--radius);
      font-size: 0.875rem; font-weight: 600; color: var(--gray-500); cursor: pointer;
      font-family: var(--font-sans); transition: all 0.15s; position: relative;
      &.active { background: white; color: var(--primary); box-shadow: var(--shadow-sm); }
      &:hover:not(.active) { color: var(--gray-700); }
    }
    .tab-badge {
      background: var(--primary); color: white; font-size: 0.65rem; font-weight: 700;
      padding: 1px 6px; border-radius: 10px; margin-left: 6px;
    }

    /* Card */
    .card { background: white; border-radius: var(--radius-lg); border: 1px solid var(--gray-200); margin-bottom: 16px; overflow: hidden; }
    .card-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--gray-100);
      h3 { font-size: 1rem; font-weight: 700; color: var(--gray-900); margin: 0; }
    }
    .card-danger .card-header { background: #fff5f5; }

    /* Info grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; padding: 8px 0; }
    .info-item { padding: 16px 24px; border-bottom: 1px solid var(--gray-50);
      &.info-item-full { grid-column: 1 / -1; }
    }
    .info-label { display: block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gray-400); margin-bottom: 4px; }
    .info-value { font-size: 0.95rem; color: var(--gray-800); font-weight: 500; }

    /* Edit */
    .edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 20px 24px; }
    .form-group-full { grid-column: 1 / -1; }
    .edit-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--gray-100); background: var(--gray-50); }

    /* Form stack */
    .form-stack { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
    .input-pass { position: relative;
      .form-control { padding-right: 44px; }
      .eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1rem; }
    }
    .form-error { font-size: 0.75rem; color: var(--danger); margin-top: 4px; display: block; }

    /* Password strength */
    .password-strength { margin-top: 8px; display: flex; align-items: center; gap: 10px; }
    .strength-bar { flex: 1; height: 4px; background: var(--gray-100); border-radius: 2px; overflow: hidden; }
    .strength-fill { height: 100%; border-radius: 2px; transition: width 0.3s, background 0.3s;
      &.weak { background: var(--danger); }
      &.medium { background: var(--warning); }
      &.strong { background: var(--success); }
    }
    .strength-label { font-size: 0.72rem; color: var(--gray-400); white-space: nowrap; }

    /* Stats */
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .stat-mini {
      background: white; border-radius: var(--radius-md); padding: 16px; text-align: center;
      border: 1px solid var(--gray-200); border-top: 3px solid var(--color);
    }
    .stat-mini-icon { font-size: 1.5rem; margin-bottom: 6px; }
    .stat-mini-val { font-size: 1.5rem; font-weight: 800; color: var(--gray-900); margin-bottom: 2px; }
    .stat-mini-label { font-size: 0.72rem; color: var(--gray-400); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

    /* Dossiers list */
    .dossiers-list { padding: 0 8px; }
    .dossier-row {
      display: flex; align-items: center; gap: 16px;
      padding: 14px 16px; border-bottom: 1px solid var(--gray-100);
      &:last-child { border-bottom: none; }
      &:hover { background: var(--gray-50); border-radius: var(--radius); }
    }
    .dossier-num { font-size: 0.75rem; font-weight: 700; color: var(--primary); font-family: monospace; min-width: 80px; }
    .dossier-info { flex: 1; }
    .dossier-desc { font-size: 0.875rem; font-weight: 500; color: var(--gray-800); margin-bottom: 2px; }
    .dossier-date { font-size: 0.75rem; color: var(--gray-400); }
    .dossier-montant { min-width: 100px; text-align: right; }
    .montant-ok { font-size: 0.875rem; font-weight: 700; color: var(--success); }
    .montant-na { color: var(--gray-300); }

    /* Badges */
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
    .badge-brouillon { background: #f1f5f9; color: #64748b; }
    .badge-soumis { background: #eff6ff; color: #3b82f6; }
    .badge-en_cours { background: #fefce8; color: #ca8a04; }
    .badge-incomplet { background: #fff7ed; color: #ea580c; }
    .badge-approuve { background: #f0fdf4; color: #16a34a; }
    .badge-rejete { background: #fef2f2; color: #dc2626; }

    /* Danger zone */
    .danger-zone { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; }
    .danger-title { font-weight: 700; color: var(--gray-800); margin-bottom: 4px; }
    .danger-desc { font-size: 0.82rem; color: var(--gray-400); }

    /* States */
    .loading-state, .empty-state { text-align: center; padding: 40px; color: var(--gray-400); }
    .empty-icon { font-size: 2.5rem; margin-bottom: 8px; }

    /* ── Famille card ────────────────────────────────── */
    .famille-card .card-header { align-items: center; }
    .famille-header-left { display: flex; align-items: center; gap: 10px; }
    .famille-header-left h3 { margin: 0; }
    .famille-count {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
      background: var(--primary); color: white; padding: 2px 8px; border-radius: 999px;
    }
    .famille-add-btn { white-space: nowrap; }

    /* Inline add panel */
    .famille-add-panel {
      border-top: 1px solid var(--gray-100);
      background: linear-gradient(to bottom, #f8fafc, white);
      padding: 20px 24px;
    }
    .famille-add-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .fam-field { display: flex; flex-direction: column; gap: 4px; }
    .fam-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gray-400); }
    .famille-add-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--gray-100); }

    /* Body + empty state */
    .famille-body { padding: 20px 24px; }
    .famille-empty-state { text-align: center; padding: 32px 16px; }
    .famille-empty-icon { font-size: 3rem; margin-bottom: 12px; }
    .famille-empty-title { font-size: 1rem; font-weight: 700; color: var(--gray-700); margin-bottom: 6px; }
    .famille-empty-sub { font-size: 0.82rem; color: var(--gray-400); line-height: 1.6; margin-bottom: 18px; }

    /* Chips */
    .family-chips { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
    .family-chip {
      display: flex; align-items: center; gap: 0;
      border-radius: 999px;
      background: white;
      border: 1.5px solid var(--chip-border, #e2e8f0);
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      transition: transform 0.12s, box-shadow 0.12s;
      overflow: hidden;
      &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    }
    /* Colour palette per relation type */
    .family-chip[data-rel="conjoint"]  { --chip-color:#1a56db; --chip-border:#bfdbfe; --chip-bg:#eff6ff; }
    .family-chip[data-rel="enfant"]    { --chip-color:#059669; --chip-border:#a7f3d0; --chip-bg:#f0fdf4; }
    .family-chip[data-rel="parent"]    { --chip-color:#7c3aed; --chip-border:#ddd6fe; --chip-bg:#f5f3ff; }
    .family-chip[data-rel="frere"]     { --chip-color:#d97706; --chip-border:#fde68a; --chip-bg:#fffbeb; }
    .family-chip[data-rel="autre"]     { --chip-color:#64748b; --chip-border:#e2e8f0; --chip-bg:#f8fafc; }
    .family-chip:not([data-rel])       { --chip-color:#1a56db; --chip-border:#bfdbfe; --chip-bg:#eff6ff; }

    .chip-avatar {
      width: 38px; height: 38px; flex-shrink: 0;
      background: var(--chip-color, var(--primary));
      color: white; font-weight: 700; font-size: 0.85rem;
      display: flex; align-items: center; justify-content: center;
      margin: 3px 0 3px 3px;
      border-radius: 50%;
    }
    .chip-info {
      display: flex; flex-direction: column; padding: 0 10px;
    }
    .chip-name { font-size: 0.88rem; font-weight: 600; color: var(--gray-800); line-height: 1.2; }
    .chip-badge {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
      color: var(--chip-color, var(--primary));
    }
    .chip-remove {
      background: transparent; border: none; cursor: pointer;
      color: var(--gray-400); padding: 0 12px 0 4px;
      font-size: 0.8rem; font-weight: 700; line-height: 1;
      height: 100%; display: flex; align-items: center;
      transition: color 0.12s;
      &:hover { color: var(--danger); }
    }

    .famille-hint { font-size: 0.75rem; color: var(--gray-400); margin-top: 4px; }
    .spinner-lg { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 12px; }
    .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin-right: 6px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .btn-sm { padding: 6px 14px; font-size: 0.8rem; }
    .btn-danger { background: var(--danger); color: white; border: none; padding: 8px 18px; border-radius: var(--radius); font-weight: 600; cursor: pointer; font-family: var(--font-sans); }
  `]
})
export class AssureProfilComponent implements OnInit {

  user: User | null = null;
  activeTab: ActiveTab = 'infos';
  editMode = false;
  saving = false;
  savingPass = false;
  successMsg = '';
  errorMsg = '';
  showOld = false;
  showNew = false;

  // Dossiers
  dossiers: any[] = [];
  totalDossiers = 0;
  loadingDossiers = false;

  editForm = { prenom: '', nom: '', telephone: '', cin: '', adresse: '' };
  passwordForm = { ancien: '', nouveau: '', confirmer: '' };

  statsCards: any[] = [];

  constructor(public authService: AuthService, private http: HttpClient, private api: ApiService) {}

  ngOnInit() {
    this.user = this.authService.currentUser();
    this.loadDossiers();
    if (this.activeTab === 'infos') {
      this.loadFamily();
    }
  }

  setActiveTab(tab: ActiveTab) {
    this.activeTab = tab;
    if (tab === 'infos') {
      // load family lazily when opening infos tab to avoid heavier initial load
      this.loadFamily();
    }
  }

  familyMembers: any[] = [];
  newFamilyMember = { nom: '', prenom: '', relation: '', dateNaissance: '' };
  familyError = '';
  showAddForm = false;

  loadFamily() {
    this.api.getFamilyMembers().subscribe({
      next: (list) => {
        const arr = list || [];
        this.familyMembers = arr.filter((f: any) => {
          if (!f) return false;
          const prenom = (f.prenom || '').toString().trim();
          const nom = (f.nom || '').toString().trim();
          // filter out empty placeholders like '-' or completely empty entries
          if ((prenom === '' && nom === '') || (prenom === '-' && nom === '-')) return false;
          return true;
        });
      },
      error: () => this.familyMembers = []
    });
  }

  resetAddForm() {
    this.newFamilyMember = { nom: '', prenom: '', relation: '', dateNaissance: '' };
    this.familyError = '';
  }

  /** Returns a normalised key for the data-rel attribute used to colour chips */
  getRelationKey(relation: string): string {
    const r = (relation || '').toLowerCase();
    if (r.includes('conjoint')) return 'conjoint';
    if (r.includes('enfant'))   return 'enfant';
    if (r.includes('parent'))   return 'parent';
    if (r.includes('fr'))       return 'frere'; // frère/sœur
    return 'autre';
  }

  ajouterMembre() {
    this.familyError = '';
    const payload = { ...this.newFamilyMember };
    this.api.ajouterMembreFamille(payload).subscribe({
      next: () => {
        this.resetAddForm();
        this.showAddForm = false;
        this.loadFamily();
      },
      error: (err) => { this.familyError = err.error?.message || 'Erreur lors de l\'ajout.'; }
    });
  }

  supprimerMembre(id: number) {
    this.api.supprimerMembreFamille(id).subscribe({
      next: () => this.loadFamily(),
      error: () => {}
    });
  }

  get initiales(): string {
    if (!this.user) return '?';
    return `${this.user.prenom?.[0] ?? ''}${this.user.nom?.[0] ?? ''}`.toUpperCase();
  }

  startEdit() {
    this.editForm = {
      prenom:    this.user?.prenom    ?? '',
      nom:       this.user?.nom       ?? '',
      telephone: this.user?.telephone ?? '',
      cin:       this.user?.cin       ?? '',
      adresse:   this.user?.adresse   ?? '',
    };
    this.editMode = true;
    this.successMsg = '';
    this.errorMsg = '';
  }

  cancelEdit() { this.editMode = false; }

  sauvegarder() {
    this.saving = true; this.successMsg = ''; this.errorMsg = '';
    this.http.put<any>(`${environment.apiUrl}/assure/profil`, this.editForm).subscribe({
      next: (res) => {
        this.saving = false;
        const updated = { ...this.user!, ...this.editForm };
        this.authService.currentUser.set(updated);
        localStorage.setItem('med_user', JSON.stringify(updated));
        this.user = updated;
        this.editMode = false;
        this.successMsg = 'Profil mis à jour avec succès.';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.saving = false;
        this.errorMsg = err.error?.message || 'Erreur lors de la mise à jour.';
      }
    });
  }

  changerMotDePasse() {
    if (!this.canChangePass()) return;
    this.savingPass = true; this.successMsg = ''; this.errorMsg = '';
    this.http.post<any>(`${environment.apiUrl}/assure/profil/changer-mot-de-passe`, {
      ancienMotDePasse: this.passwordForm.ancien,
      nouveauMotDePasse: this.passwordForm.nouveau
    }).subscribe({
      next: () => {
        this.savingPass = false;
        this.passwordForm = { ancien: '', nouveau: '', confirmer: '' };
        this.successMsg = 'Mot de passe changé avec succès.';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.savingPass = false;
        this.errorMsg = err.error?.message || 'Mot de passe actuel incorrect.';
      }
    });
  }

  canChangePass(): boolean {
    return !!(this.passwordForm.ancien &&
              this.passwordForm.nouveau &&
              this.passwordForm.nouveau.length >= 6 &&
              this.passwordForm.nouveau === this.passwordForm.confirmer);
  }

  loadDossiers() {
    this.loadingDossiers = true;
    this.api.mesDossiers({ size: 100 }).subscribe({
      next: (page: any) => {
        this.dossiers = page.content ?? [];
        this.totalDossiers = page.totalElements ?? 0;
        this.buildStats();
        this.loadingDossiers = false;
      },
      error: () => { this.loadingDossiers = false; }
    });
  }

  buildStats() {
    const statuts = this.dossiers.map(d => d.statut);
    const totalRembourse = this.dossiers.reduce((s, d) => s + (d.montantRembourse ?? 0), 0);
    this.statsCards = [
      { icon: '📁', label: 'Total dossiers', value: this.totalDossiers, color: '#6366f1' },
      { icon: '✅', label: 'Approuvés', value: statuts.filter(s => s === 'APPROUVE').length, color: '#10b981' },
      { icon: '⏳', label: 'En traitement', value: statuts.filter(s => ['SOUMIS','EN_COURS'].includes(s)).length, color: '#f59e0b' },
      { icon: '💰', label: 'Remboursé (TND)', value: totalRembourse.toFixed(0), color: '#3b82f6' },
    ];
  }

  getStatutLabel(s: string): string {
    const m: Record<string, string> = {
      BROUILLON: 'Brouillon', SOUMIS: 'Soumis', EN_COURS: 'En cours',
      INCOMPLET: 'Incomplet', APPROUVE: 'Approuvé', REJETE: 'Rejeté'
    };
    return m[s] ?? s;
  }

  getStatutClass(s: string): string {
    return 'badge-' + s.toLowerCase().replace('_', '_');
  }

  get strengthPct(): number {
    const p = this.passwordForm.nouveau;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return (score / 5) * 100;
  }

  get strengthClass(): string {
    const pct = this.strengthPct;
    if (pct <= 40) return 'weak';
    if (pct <= 70) return 'medium';
    return 'strong';
  }

  get strengthLabel(): string {
    const pct = this.strengthPct;
    if (pct <= 40) return 'Faible';
    if (pct <= 70) return 'Moyen';
    return 'Fort';
  }
}
