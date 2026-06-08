import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-force-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fcp-page">
      <div class="fcp-card">

        <div class="fcp-icon">🔐</div>
        <h2 class="fcp-title">Changement de mot de passe requis</h2>
        <p class="fcp-subtitle">
          Votre compte a été créé par un administrateur.<br>
          Vous devez définir un nouveau mot de passe sécurisé avant de continuer.
        </p>

        @if (error) {
          <div class="fcp-alert fcp-alert-danger">⚠️ {{ error }}</div>
        }
        @if (success) {
          <div class="fcp-alert fcp-alert-success">✅ {{ success }}</div>
        }

        @if (!success) {
          <form (ngSubmit)="onSubmit()" #f="ngForm">

            <div class="form-group">
              <label class="form-label">Mot de passe actuel (temporaire)</label>
              <div class="input-password">
                <input
                  [type]="showOldPassword ? 'text' : 'password'"
                  class="form-control"
                  [(ngModel)]="oldPassword"
                  name="oldPassword"
                  placeholder="••••••••"
                  required
                />
                <button type="button" class="toggle-pass" (click)="showOldPassword = !showOldPassword">
                  {{ showOldPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nouveau mot de passe</label>
              <div class="input-password">
                <input
                  [type]="showNewPassword ? 'text' : 'password'"
                  class="form-control"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  placeholder="••••••••"
                  required
                />
                <button type="button" class="toggle-pass" (click)="showNewPassword = !showNewPassword">
                  {{ showNewPassword ? '🙈' : '👁️' }}
                </button>
              </div>
              <div class="fcp-rules">
                <span [class.rule-ok]="newPassword.length >= 12">✓ 12 caractères min.</span>
                <span [class.rule-ok]="hasUppercase()">✓ Une majuscule</span>
                <span [class.rule-ok]="hasLowercase()">✓ Une minuscule</span>
                <span [class.rule-ok]="hasDigit()">✓ Un chiffre</span>
                <span [class.rule-ok]="hasSpecial()">✓ Un caractère spécial</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Confirmer le nouveau mot de passe</label>
              <div class="input-password">
                <input
                  [type]="showConfirmPassword ? 'text' : 'password'"
                  class="form-control"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                />
                <button type="button" class="toggle-pass" (click)="showConfirmPassword = !showConfirmPassword">
                  {{ showConfirmPassword ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (confirmPassword && newPassword !== confirmPassword) {
                <small class="fcp-mismatch">Les mots de passe ne correspondent pas.</small>
              }
            </div>

            <button type="submit" class="fcp-btn" [disabled]="loading">
              @if (loading) {
                <span class="spinner"></span> Mise à jour...
              } @else {
                Enregistrer et continuer →
              }
            </button>
          </form>
        }

      </div>
    </div>
  `,
  styles: [`
    .fcp-page {
      display: flex;
      min-height: 100vh;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1a56db 100%);
      padding: 24px;
    }

    .fcp-card {
      background: #fff;
      border-radius: 20px;
      padding: 48px 40px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    }

    .fcp-icon {
      font-size: 2.5rem;
      text-align: center;
      margin-bottom: 12px;
    }

    .fcp-title {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 1.6rem;
      font-weight: 700;
      color: #0f172a;
      text-align: center;
      margin: 0 0 10px;
    }

    .fcp-subtitle {
      color: #64748b;
      font-size: 0.9rem;
      line-height: 1.6;
      text-align: center;
      margin: 0 0 28px;
    }

    .fcp-alert {
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 0.9rem;
      margin-bottom: 20px;
    }

    .fcp-alert-danger {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #991b1b;
    }

    .fcp-alert-success {
      background: #f0fdf4;
      border: 1px solid #86efac;
      color: #166534;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
    }

    .form-control {
      width: 100%;
      padding: 10px 44px 10px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .form-control:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }

    .input-password {
      position: relative;
    }

    .toggle-pass {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 4px;
    }

    .fcp-rules {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .fcp-rules span {
      font-size: 0.75rem;
      color: #94a3b8;
      background: #f1f5f9;
      border-radius: 6px;
      padding: 3px 8px;
      transition: all 0.2s;
    }

    .fcp-rules span.rule-ok {
      color: #166534;
      background: #dcfce7;
    }

    .fcp-mismatch {
      display: block;
      margin-top: 5px;
      font-size: 0.8rem;
      color: #dc2626;
    }

    .fcp-btn {
      width: 100%;
      padding: 13px;
      background: linear-gradient(135deg, #1a56db, #1e3a8a);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .fcp-btn:hover:not(:disabled) {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .fcp-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: inline-block;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ForceChangePasswordComponent {
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';

  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  loading = false;
  error = '';
  success = '';

  constructor(private http: HttpClient, private authService: AuthService) {}

  hasUppercase(): boolean { return /[A-Z]/.test(this.newPassword); }
  hasLowercase(): boolean { return /[a-z]/.test(this.newPassword); }
  hasDigit(): boolean { return /\d/.test(this.newPassword); }
  hasSpecial(): boolean { return /[\W_]/.test(this.newPassword); }

  isPasswordStrong(): boolean {
    return this.newPassword.length >= 12
      && this.hasUppercase()
      && this.hasLowercase()
      && this.hasDigit()
      && this.hasSpecial();
  }

  onSubmit() {
    this.error = '';

    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.error = 'Veuillez remplir tous les champs.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Les nouveaux mots de passe ne correspondent pas.';
      return;
    }

    if (!this.isPasswordStrong()) {
      this.error = 'Le nouveau mot de passe ne respecte pas les règles de sécurité.';
      return;
    }

    this.loading = true;

    const role = this.authService.getRole();
    let endpoint = '';
    if (role === 'ROLE_AGENT') {
      endpoint = `${environment.apiUrl}/agent/profil/changer-mot-de-passe`;
    } else if (role === 'ROLE_ASSURE') {
      endpoint = `${environment.apiUrl}/assure/profil/changer-mot-de-passe`;
    } else {
      endpoint = `${environment.apiUrl}/admin/profil/changer-mot-de-passe`;
    }

    this.http.post<any>(endpoint, {
      ancienMotDePasse: this.oldPassword,
      nouveauMotDePasse: this.newPassword
    }).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Mot de passe modifié avec succès. Redirection en cours...';
        setTimeout(() => {
          this.authService.redirectToDashboard();
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Erreur lors du changement de mot de passe.';
      }
    });
  }
}
