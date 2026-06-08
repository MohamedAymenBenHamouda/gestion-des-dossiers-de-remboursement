// ============================================
// MODELS / INTERFACES
// ============================================

export type Role = 'ROLE_ADMIN' | 'ROLE_AGENT' | 'ROLE_ASSURE';
export type TypeSoin = 'CONSULTATION' | 'HOSPITALISATION' | 'DENTAIRE' | 'OPTIQUE' | 'ALD' | 'PHARMACIE' | 'AUTRE';
export type DossierStatus = 'BROUILLON' | 'SOUMIS'  | 'EN_COURS' | 'INCOMPLET' | 'APPROUVE' | 'REJETE';
export type DocumentType = 'VISITE_MEDICALE' | 'ORDONNANCE' | 'ANALYSE' | 'SCANNER' | 'RADIO' | 'FACTURE_PHARMACIE' | 'FACTURE_RADIO' | 'FACTURE_SCANNER' | 'FACTURE_LABO' | 'FACTURE_IRM' | 'BULLETIN_SORTIE' | 'FACTURE' | 'AUTRE';
export type DocumentWorkflowStatus = 'UPLOADED' | 'ANALYSED' | 'VALIDATED' | 'REJECTED';
export type AIValidationStatus = 'EN_ATTENTE' | 'VALIDE' | 'INVALIDE' | 'ERREUR';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  cin?: string;
  telephone?: string;
  adresse?: string;
  role: Role;
  actif: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
  verificationRequired?: boolean;
  mustChangePassword?: boolean;
}

export interface Document {
  id: number;
  type: DocumentType;
  typeDetecteIA?: DocumentType;
  workflowStatus: DocumentWorkflowStatus;
  nomFichier: string;
  contentType: string;
  tailleFichier: number;
  statutIA: AIValidationStatus;
  resultatIA?: string;
  montantDetecteIA?: number;
  scoreConfidenceIA?: number;
  createdAt: string;
  analyseAt?: string;
  analyseIA?: any;
}

export interface Dossier {
  id: number;
  numeroDossier: string;
  description: string;
  motif?: string;
  typeSoin?: TypeSoin;
  statut: DossierStatus;
  assure: User;
  agent?: User;
  montantTotal?: number;
  montantRembourse?: number;
  montantCalculeIA?: number;
  messageAgent?: string;
  noteRejet?: string;
  createdAt: string;
  dateSoumission?: string;
  dateValidation?: string;
  documents: Document[];
}

export interface Notification {
  id: number;
  titre: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  lu: boolean;
  dossierIdRef?: number;
  createdAt: string;
}

export interface DashboardStats {
  totalDossiers: number;
  dossiersEnCours: number;
  dossiersApprouves: number;
  dossiersRejetes: number;
  dossiersIncomplets: number;
  dossiersSoumis: number;
  totalMontantDemande: number;
  totalMontantRembourse: number;
  totalAssures: number;
  totalAgents: number;
  totalAdmins: number;
  assuresActifs: number;
  dossiersParStatut: Record<string, number>;
  dossiersParMois: Record<string, number>;
  tauxApprobation: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}