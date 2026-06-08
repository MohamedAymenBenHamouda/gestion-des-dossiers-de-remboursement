import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-brand">
        <div class="brand-content">
          <div class="brand-logo">🏥</div>
          <h1 class="brand-title">MedRembours</h1>
          <p class="brand-desc">Système intelligent de gestion des dossiers de remboursement médical</p>
        </div>
      </div>

      <div class="auth-form-side">
        <div class="auth-form-container">
          <div class="auth-header">
            <h2>Connexion</h2>
            <p>Accédez à votre espace personnel</p>
          </div>

          @if (error) {
            <div class="alert alert-danger">⚠️ {{ error }}</div>
          }

          <form (ngSubmit)="onLogin()" #f="ngForm">
            <div class="form-group">
              <label class="form-label">Adresse email</label>
              <input
                type="email"
                class="form-control"
                [(ngModel)]="email"
                name="email"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Mot de passe</label>
              <div class="input-password">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  class="form-control"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="••••••••"
                  required
                />
                <button type="button" class="toggle-pass" (click)="showPassword = !showPassword">
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            

            <button type="submit" class="btn btn-primary btn-full" [disabled]="loading">
              @if (loading) { <span class="spinner"></span> Connexion... }
              @else { Se connecter }
            </button>
          </form>

          <p class="auth-footer">
            Pas encore de compte ?
            <a routerLink="/auth/register">Créer un compte</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      min-height: 100vh;
    }

    .auth-brand {
      flex: 1;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1a56db 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 40px;
    }

    .brand-content {
      max-width: 420px;
      color: white;
    }

    .brand-logo {
      font-size: 4rem;
      margin-bottom: 16px;
    }

    .brand-title {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 2.5rem;
      font-weight: 600;
      letter-spacing: -0.03em;
      margin-bottom: 12px;
    }

    .brand-desc {
      font-size: 1rem;
      opacity: 0.7;
      line-height: 1.7;
      margin-bottom: 40px;
    }

    .brand-features {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feature-item {
      font-size: 0.9rem;
      opacity: 0.85;
      padding: 12px 16px;
      background: rgba(255,255,255,0.08);
      border-radius: 10px;
      backdrop-filter: blur(4px);
    }

    .auth-form-side {
      width: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      background: #fff;
    }

    .auth-form-container {
      width: 100%;
      max-width: 380px;
    }

    .auth-header {
      margin-bottom: 32px;

      h2 {
        font-family: 'Fraunces', Georgia, serif;
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--gray-900);
        margin-bottom: 6px;
      }

      p {
        color: var(--gray-500);
        font-size: 0.9rem;
      }
    }

    .input-password {
      position: relative;

      .form-control { padding-right: 44px; }

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
    }

    .demo-accounts {
      background: var(--gray-50);
      border-radius: var(--radius);
      padding: 14px;
      margin-bottom: 20px;

      p {
        font-size: 0.78rem;
        color: var(--gray-500);
        font-weight: 600;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .demo-buttons {
      display: flex;
      gap: 8px;
    }

    .demo-btn {
      flex: 1;
      padding: 8px 4px;
      background: var(--white);
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--gray-700);
      transition: all 0.15s;
      font-family: var(--font-sans);

      &:hover {
        border-color: var(--primary);
        color: var(--primary);
        background: var(--primary-50);
      }
    }

    .btn-full {
      width: 100%;
      justify-content: center;
      padding: 12px;
      font-size: 0.95rem;
    }

    .auth-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 0.875rem;
      color: var(--gray-500);

      a {
        color: var(--primary);
        font-weight: 600;
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
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

    @media (max-width: 768px) {
      .auth-page { flex-direction: column; }
      .auth-brand { padding: 40px 24px; }
      .auth-form-side { width: 100%; padding: 24px; }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  fillDemo(role: 'admin' | 'agent' | 'assure') {
    const map = {
      admin: { email: 'admin@medical.tn', password: 'MonMotDePasse@2026' },
      agent: { email: 'agent@medical.tn', password: 'TestSecure123!' },
      assure: { email: 'assure@medical.tn', password: 'MonMotDePasse@2025' },
    };
    this.email = map[role].email;
    this.password = map[role].password;
  }

  onLogin() {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.error = '';
    this.authService.login(this.email, this.password).subscribe({
      next: (data) => {
        this.loading = false;
        if (data.mustChangePassword) {
          this.router.navigate(['/auth/force-change-password']);
        } else {
          this.authService.redirectToDashboard();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Email ou mot de passe incorrect.';
      }
    });
  }
}
