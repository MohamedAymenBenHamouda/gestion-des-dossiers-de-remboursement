import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-brand">
        <div class="brand-content">
          <div class="brand-logo">🏥</div>
          <h1 class="brand-title">MedRembours</h1>
          <p class="brand-desc">Créez votre compte assuré et commencez à gérer vos remboursements médicaux facilement.</p>
        </div>
      </div>
      <div class="auth-form-side">
        <div class="auth-form-container">
          <div class="auth-header">
            <h2>Créer un compte</h2>
            <p>Inscription assuré</p>
          </div>

          @if (error) { <div class="alert alert-danger">⚠️ {{ error }}</div> }
          @if (success) { <div class="alert alert-success">✅ {{ success }}</div> }

          <form (ngSubmit)="onRegister()" #f="ngForm">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Nom *</label>
                <input class="form-control" [(ngModel)]="form.nom" name="nom" placeholder="Nom" required />
              </div>
              <div class="form-group">
                <label class="form-label">Prénom *</label>
                <input class="form-control" [(ngModel)]="form.prenom" name="prenom" placeholder="Prénom" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Email *</label>
              <input type="email" class="form-control" [(ngModel)]="form.email" name="email" placeholder="email@exemple.com" required />
            </div>

            <div class="form-group">
              <label class="form-label">Mot de passe *</label>
              <input type="password" class="form-control" [(ngModel)]="form.password" name="password" placeholder="au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial" required minlength="6" />
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">CIN</label>
                <input class="form-control" [(ngModel)]="form.cin" name="cin" placeholder="12345678" />
              </div>
              <div class="form-group">
                <label class="form-label">Téléphone</label>
                <input class="form-control" [(ngModel)]="form.telephone" name="telephone" placeholder="22334455" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Adresse</label>
              <input class="form-control" [(ngModel)]="form.adresse" name="adresse" placeholder="Votre adresse" />
            </div>

            <button type="submit" class="btn btn-primary btn-full" [disabled]="loading">
              @if (loading) { <span class="spinner"></span> Inscription... }
              @else { Créer mon compte }
            </button>
          </form>

          <p class="auth-footer">
            Déjà un compte ? <a routerLink="/auth/login">Se connecter</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; min-height: 100vh; }
    .auth-brand {
      flex: 1;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1a56db 100%);
      display: flex; align-items: center; justify-content: center; padding: 60px 40px;
    }
    .brand-content { max-width: 420px; color: white; }
    .brand-logo { font-size: 4rem; margin-bottom: 16px; }
    .brand-title { font-family: 'Fraunces', Georgia, serif; font-size: 2.5rem; font-weight: 600; margin-bottom: 12px; }
    .brand-desc { font-size: 1rem; opacity: 0.7; line-height: 1.7; }
    .auth-form-side { width: 500px; display: flex; align-items: center; justify-content: center; padding: 40px; background: #fff; overflow-y: auto; }
    .auth-form-container { width: 100%; max-width: 420px; }
    .auth-header { margin-bottom: 28px; h2 { font-family: 'Fraunces', Georgia, serif; font-size: 1.75rem; font-weight: 600; color: var(--gray-900); margin-bottom: 6px; } p { color: var(--gray-500); } }
    .btn-full { width: 100%; justify-content: center; padding: 12px; font-size: 0.95rem; }
    .auth-footer { text-align: center; margin-top: 20px; font-size: 0.875rem; color: var(--gray-500); a { color: var(--primary); font-weight: 600; text-decoration: none; } }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) { .auth-page { flex-direction: column; } .auth-form-side { width: 100%; } }
  `]
})
export class RegisterComponent {
  form = { nom: '', prenom: '', email: '', password: '', cin: '', telephone: '', adresse: '' };
  loading = false;
  error = '';
  success = '';

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    this.loading = true;
    this.error = '';
    this.authService.register(this.form).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.verificationRequired) {
          this.router.navigate(['/auth/verify'], { state: { email: this.form.email } });
        } else {
          this.authService.redirectToDashboard();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Erreur lors de l\'inscription.';
      }
    });
  }
}
