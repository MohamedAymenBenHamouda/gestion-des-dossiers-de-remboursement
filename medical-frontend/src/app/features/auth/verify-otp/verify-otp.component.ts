import { Component, OnInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-brand">
        <div class="brand-content">
          <div class="brand-logo">🏥</div>
          <h1 class="brand-title">MedRembours</h1>
          <p class="brand-desc">Vérifiez votre compte pour accéder à votre espace sécurisé.</p>
        </div>
      </div>
      <div class="auth-form-side">
        <div class="auth-form-container">
          <div class="auth-header" style="text-align: center;">
            <div class="email-icon">
              <span>📧</span>
            </div>
            <h2>Vérification par email</h2>
            <p>Un code à 6 chiffres a été envoyé à</p>
            <p class="email-display">{{ maskedEmail }}</p>
          </div>

          @if (error) { <div class="alert alert-danger">⚠️ {{ error }}</div> }
          @if (success) { <div class="alert alert-success">✅ {{ success }}</div> }

          <div class="otp-container">
            <p class="otp-label">ENTREZ VOTRE CODE</p>
            <div class="otp-inputs" [class.shake]="shakeAnimation">
              <input *ngFor="let digit of otpArray; let i = index"
                     #otpInput
                     type="text" 
                     maxlength="1"
                     [(ngModel)]="digit.value"
                     (ngModelChange)="onOtpChange(i, $event)"
                     (keydown)="onKeyDown(i, $event)"
                     (paste)="onPaste($event)"
                     class="otp-input" />
            </div>
          </div>

          <button class="btn btn-primary btn-full" [disabled]="loading || isCodeIncomplete()" (click)="onVerify()">
            @if (loading) { <span class="spinner"></span> Vérification... }
            @else { Vérifier mon email }
          </button>

          <div class="resend-container">
            @if (resendCountdown > 0) {
              <p class="resend-text"><span class="timer-icon">⏱</span> Renvoyer dans {{ resendCountdown }}s</p>
            } @else {
              <button class="btn-link" [disabled]="resendLoading" (click)="onResend()">
                @if (resendLoading) { <span class="spinner-sm"></span> }
                @else { 🔄 Renvoyer le code }
              </button>
            }
          </div>

          <p class="auth-footer">
            <a href="javascript:void(0)" (click)="goBack()">Changer d'email</a>
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
    .brand-content { max-width: 420px; color: white; text-align: left; }
    .brand-logo { font-size: 4rem; margin-bottom: 16px; }
    .brand-title { font-family: 'Fraunces', Georgia, serif; font-size: 2.5rem; font-weight: 600; margin-bottom: 12px; }
    .brand-desc { font-size: 1rem; opacity: 0.7; line-height: 1.7; }
    .auth-form-side { width: 500px; display: flex; align-items: center; justify-content: center; padding: 40px; background: #fff; overflow-y: auto; }
    .auth-form-container { width: 100%; max-width: 420px; }
    
    .auth-header { margin-bottom: 30px; }
    .auth-header h2 { font-family: 'Fraunces', Georgia, serif; font-size: 1.75rem; font-weight: 600; color: var(--gray-900); margin-bottom: 6px; }
    .auth-header p { color: var(--gray-500); margin-bottom: 2px; }
    .email-display { font-weight: 600; color: var(--gray-800) !important; font-size: 1.1rem; }
    .email-icon { width: 64px; height: 64px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 28px; border: 2px solid #bfdbfe; }
    
    .otp-container { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center; }
    .otp-label { color: #64748b; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; margin-bottom: 16px; }
    .otp-inputs { display: flex; justify-content: space-between; gap: 8px; }
    .otp-input { width: 46px; height: 56px; border-radius: 12px; border: 1px solid #cbd5e1; background: #fff; text-align: center; font-size: 1.5rem; font-weight: 700; color: #0f172a; transition: all 0.2s; }
    .otp-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    .otp-input:not(:placeholder-shown) { background: #eff6ff; border-color: #93c5fd; }
    
    .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
    @keyframes shake { 10%, 90% { transform: translate3d(-2px, 0, 0); } 20%, 80% { transform: translate3d(3px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-5px, 0, 0); } 40%, 60% { transform: translate3d(5px, 0, 0); } }
    
    .btn-full { width: 100%; justify-content: center; padding: 14px; font-size: 1rem; border-radius: 12px; }
    
    .resend-container { margin-top: 24px; text-align: center; height: 24px; }
    .resend-text { color: #64748b; font-size: 0.9rem; }
    .btn-link { background: none; border: none; color: #64748b; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: color 0.2s; display: inline-flex; align-items: center; justify-content: center; }
    .btn-link:hover:not([disabled]) { color: var(--primary); }
    .btn-link[disabled] { opacity: 0.5; cursor: not-allowed; }
    
    .auth-footer { text-align: center; margin-top: 32px; font-size: 0.875rem; }
    .auth-footer a { color: #64748b; text-decoration: underline; }
    
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(100,116,139,0.3); border-top-color: #64748b; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin-right: 6px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    @media (max-width: 768px) { .auth-page { flex-direction: column; } .auth-form-side { width: 100%; } }
  `]
})
export class VerifyOtpComponent implements OnInit {
  email: string = '';
  maskedEmail: string = '';
  otpArray: { value: string }[] = [
    { value: '' }, { value: '' }, { value: '' }, 
    { value: '' }, { value: '' }, { value: '' }
  ];
  
  loading = false;
  resendLoading = false;
  error = '';
  success = '';
  shakeAnimation = false;
  
  resendCountdown = 0;
  private interval: any;

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

  constructor(private authService: AuthService, private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state && navigation.extras.state['email']) {
      this.email = navigation.extras.state['email'];
      this.maskEmail();
    } else {
      // Pour éviter de bloquer en cas de rechargement manuel, vous pouvez le décommenter ou gérer autrement
      // this.router.navigate(['/auth/login']);
    }
  }

  ngOnInit() {
    this.startCountdown();
  }

  maskEmail() {
    const parts = this.email.split('@');
    if (parts.length === 2) {
      const name = parts[0];
      const domain = parts[1];
      if (name.length > 2) {
        this.maskedEmail = name.substring(0, 2) + '***@' + domain;
      } else {
        this.maskedEmail = name[0] + '***@' + domain;
      }
    } else {
      this.maskedEmail = this.email;
    }
  }

  onOtpChange(index: number, value: string) {
    // Nettoyer si ce n'est pas un chiffre
    if (!/^\d*$/.test(value)) {
      this.otpArray[index].value = '';
      return;
    }

    if (value && index < 5) {
      // Focus le prochain input
      const nextInput = this.otpInputs.toArray()[index + 1].nativeElement;
      nextInput.focus();
    }

    // Si tout est rempli, on vérifie
    if (!this.isCodeIncomplete()) {
      this.onVerify();
    }
  }

  onKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.otpArray[index].value && index > 0) {
      // Retour arrière si la case actuelle est vide
      this.otpArray[index - 1].value = '';
      const prevInput = this.otpInputs.toArray()[index - 1].nativeElement;
      prevInput.focus();
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text');
    if (!pastedData) return;

    // Extraire uniquement les chiffres
    const numbers = pastedData.replace(/\D/g, '').split('');
    if (numbers.length === 0) return;

    // Remplir les cases à partir de la première
    for (let i = 0; i < 6; i++) {
      if (i < numbers.length) {
        this.otpArray[i].value = numbers[i];
      }
    }

    // Focus la dernière case remplie ou la dernière tout court
    const focusIndex = Math.min(numbers.length, 5);
    setTimeout(() => {
      if (this.otpInputs) {
        this.otpInputs.toArray()[focusIndex === 6 ? 5 : focusIndex].nativeElement.focus();
      }
      if (!this.isCodeIncomplete()) {
        this.onVerify();
      }
    }, 50);
  }

  isCodeIncomplete(): boolean {
    return this.otpArray.some(item => !item.value || item.value.trim() === '');
  }

  onVerify() {
    if (this.isCodeIncomplete()) {
      this.triggerShake();
      this.error = 'Veuillez saisir les 6 chiffres du code.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    const code = this.otpArray.map(item => item.value).join('');

    this.authService.verifyOtp(this.email, code).subscribe({
      next: (res) => {
        this.loading = false;
        this.authService.redirectToDashboard();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Code incorrect ou expiré.';
        this.triggerShake();
        this.resetOtp();
      }
    });
  }

  resetOtp() {
    this.otpArray.forEach(item => item.value = '');
    setTimeout(() => {
      if (this.otpInputs && this.otpInputs.first) {
        this.otpInputs.first.nativeElement.focus();
      }
    }, 100);
  }

  onResend() {
    if (this.resendLoading || this.resendCountdown > 0) return;
    
    this.resendLoading = true;
    this.error = '';
    this.success = '';
    
    this.authService.resendOtp(this.email).subscribe({
      next: () => {
        this.resendLoading = false;
        this.success = 'Un nouveau code a été envoyé à votre adresse email.';
        this.startCountdown();
        this.resetOtp();
      },
      error: (err) => {
        this.resendLoading = false;
        this.error = err.error?.message || 'Erreur lors du renvoi du code.';
      }
    });
  }

  startCountdown() {
    this.resendCountdown = 60;
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => {
      if (this.resendCountdown > 0) {
        this.resendCountdown--;
      } else {
        clearInterval(this.interval);
      }
    }, 1000);
  }

  triggerShake() {
    this.shakeAnimation = true;
    setTimeout(() => {
      this.shakeAnimation = false;
    }, 500);
  }

  goBack() {
    this.router.navigate(['/auth/register']);
  }
}
