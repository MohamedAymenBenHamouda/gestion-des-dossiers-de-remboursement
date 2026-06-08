import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, Page, Dossier, User, DashboardStats, Notification } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private get<T>(path: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => {
        if (params[k] !== null && params[k] !== undefined) {
          httpParams = httpParams.set(k, params[k]);
        }
      });
    }
    return this.http.get<ApiResponse<T>>(`${this.base}${path}`, { params: httpParams })
      .pipe(map(r => r.data));
  }

  private post<T>(path: string, body: any): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.base}${path}`, body)
      .pipe(map(r => r.data));
  }

  private put<T>(path: string, body: any): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.base}${path}`, body)
      .pipe(map(r => r.data));
  }

  private patch<T>(path: string, body?: any): Observable<T> {
    return this.http.patch<ApiResponse<T>>(`${this.base}${path}`, body ?? {})
      .pipe(map(r => r.data));
  }

  private delete<T>(path: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.base}${path}`)
      .pipe(map(r => r.data));
  }

  // ========= ADMIN =========
  getDashboard(): Observable<DashboardStats> {
    return this.get('/admin/dashboard');
  }

  getTousUtilisateurs(): Observable<User[]> {
    return this.get('/admin/utilisateurs');
  }

  getAgents(): Observable<User[]> {
    return this.get('/admin/utilisateurs/agents');
  }

  getAssures(): Observable<User[]> {
    return this.get('/admin/utilisateurs/assures');
  }

  creerUtilisateur(data: any): Observable<User> {
    return this.post('/admin/utilisateurs', data);
  }

  mettreAJourUtilisateur(id: number, data: any): Observable<User> {
    return this.put(`/admin/utilisateurs/${id}`, data);
  }

  activerUtilisateur(id: number): Observable<User> {
    return this.patch(`/admin/utilisateurs/${id}/activer`);
  }

  desactiverUtilisateur(id: number): Observable<User> {
    return this.patch(`/admin/utilisateurs/${id}/desactiver`);
  }

  supprimerUtilisateur(id: number): Observable<void> {
    return this.delete(`/admin/utilisateurs/${id}`);
  }

  getTousDossiers(params?: any): Observable<Page<Dossier>> {
    return this.get('/admin/dossiers', params);
  }

  // ========= AGENT =========
  getDossiersSoumis(params?: any): Observable<Page<Dossier>> {
    return this.get('/agent/dossiers/soumis', params);
  }

  getDossiersAgent(params?: any): Observable<Page<Dossier>> {
    return this.get('/agent/dossiers', params);
  }

  prendreEnCharge(id: number): Observable<Dossier> {
    return this.post(`/agent/dossiers/${id}/prendre-en-charge`, {});
  }

  validerDossier(id: number, data: any): Observable<Dossier> {
    return this.post(`/agent/dossiers/${id}/valider`, data);
  }

  getHistoriqueDossier(id: number): Observable<any[]> {
    return this.get(`/agent/dossiers/${id}/historique`);
  }

  // ========= ASSURE =========
  creerDossier(data: any): Observable<Dossier> {
    return this.post('/assure/dossiers', data);
  }

  mesDossiers(params?: any): Observable<Page<Dossier>> {
    return this.get('/assure/dossiers', params);
  }

  getDossier(id: number): Observable<Dossier> {
    return this.get(`/assure/dossiers/${id}`);
  }

  getDossierAgent(id: number): Observable<Dossier> {
    return this.get(`/agent/dossiers/${id}`);
  }

  getDossierAdmin(id: number): Observable<Dossier> {
    return this.get(`/admin/dossiers/${id}`);
  }

  soumettreDossier(id: number): Observable<Dossier> {
    return this.post(`/assure/dossiers/${id}/soumettre`, {});
  }

  uploadDocument(dossierId: number, formData: FormData): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.base}/assure/dossiers/${dossierId}/documents`, formData
    ).pipe(map(r => r.data));
  }

  getDocuments(dossierId: number): Observable<any[]> {
    return this.get(`/assure/dossiers/${dossierId}/documents`);
  }

  getFamilyMembers(): Observable<any[]> {
    return this.get('/assure/famille');
  }

  ajouterMembreFamille(data: any): Observable<any> {
    return this.post('/assure/famille', data);
  }

  supprimerMembreFamille(id: number): Observable<void> {
    return this.delete(`/assure/famille/${id}`);
  }

  // ========= NOTIFICATIONS =========
  getNotifications(role: string): Observable<Notification[]> {
    const path = role === 'ROLE_ASSURE' ? '/assure/notifications' : '/agent/notifications';
    return this.get(path);
  }

  countNotificationsNonLues(): Observable<number> {
    return this.get('/assure/notifications/count');
  }

  marquerNotifLue(id: number, role: string): Observable<void> {
    const path = role === 'ROLE_ASSURE' ? `/assure/notifications/${id}/lire` : `/agent/notifications/${id}/lire`;
    return this.patch(path);
  }

  marquerToutesLues(): Observable<void> {
    return this.patch('/assure/notifications/lire-toutes');
  }
}
