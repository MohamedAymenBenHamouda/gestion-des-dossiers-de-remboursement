import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify',
    loadComponent: () => import('./verify-otp/verify-otp.component').then(m => m.VerifyOtpComponent)
  },
  {
    path: 'force-change-password',
    loadComponent: () => import('./force-change-password/force-change-password.component').then(m => m.ForceChangePasswordComponent)
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
