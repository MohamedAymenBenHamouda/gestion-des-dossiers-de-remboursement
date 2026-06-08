# 🏥 Système Intelligent de Gestion des Dossiers de Remboursement Médical
## Backend Spring Boot - PFE 2025-2026

---

## 📋 Description

Backend complet du système de gestion des dossiers de remboursement médical avec :
- **Authentification JWT** sécurisée (3 rôles : Admin, Agent, Assuré)
- **Gestion complète des dossiers** médicaux
- **Upload de documents** médicaux (visite, ordonnance, analyse, scanner, radio)
- **Module IA** d'analyse automatique des documents + calcul de remboursement
- **Workflow de validation** Agent → Approbation / Rejet / Incomplet
- **Notifications** in-app + email
- **Dashboard** statistique pour l'administrateur

---

## 🛠️ Stack Technique

| Couche | Technologie |
|--------|-------------|
| Framework | Spring Boot 3.2 |
| Sécurité | Spring Security + JWT |
| ORM | Spring Data JPA + Hibernate |
| Base de données | PostgreSQL |
| Build | Maven |
| Java | 17+ |

---

## 🚀 Démarrage Rapide

### Prérequis
- Java 17+
- Maven 3.8+
- PostgreSQL 14+
- IntelliJ IDEA (recommandé)

### 1. Cloner / Ouvrir le projet dans IntelliJ IDEA

```
File → Open → Sélectionner le dossier medical-reimbursement-backend
```

IntelliJ détectera automatiquement le projet Maven.

### 2. Configurer la base de données

Créer la base de données PostgreSQL :
```sql
CREATE DATABASE medical_reimbursement_db;
```

Modifier `src/main/resources/application.properties` :
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/medical_reimbursement_db
spring.datasource.username=postgres
spring.datasource.password=VOTRE_MOT_DE_PASSE
```

### 3. Lancer l'application

Dans IntelliJ : Clic droit sur `MedicalReimbursementApplication.java` → **Run**

Ou via Maven :
```bash
mvn spring-boot:run
```

Le serveur démarre sur **http://localhost:8080/api**

### 4. Comptes de démonstration (créés automatiquement)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@medical.tn | Admin@123 |
| Agent | agent@medical.tn | Agent@123 |
| Assuré | assure@medical.tn | Assure@123 |

---

## 📡 API Endpoints

### 🔐 Authentification (`/api/auth`)
```
POST /api/auth/register   → Inscription (assuré par défaut)
POST /api/auth/login      → Connexion → retourne JWT token
```

### 👤 Assuré (`/api/assure`) - Token requis
```
POST   /api/assure/dossiers                          → Créer un dossier
GET    /api/assure/dossiers                          → Mes dossiers (paginé)
GET    /api/assure/dossiers/{id}                     → Détail dossier
POST   /api/assure/dossiers/{id}/soumettre           → Soumettre le dossier
POST   /api/assure/dossiers/{id}/documents           → Upload document (multipart)
GET    /api/assure/dossiers/{id}/documents           → Liste documents du dossier
GET    /api/assure/notifications                     → Mes notifications
GET    /api/assure/notifications/non-lues            → Notifications non lues
GET    /api/assure/notifications/count               → Nombre non lues
PATCH  /api/assure/notifications/{id}/lire           → Marquer comme lue
PATCH  /api/assure/notifications/lire-toutes         → Tout marquer comme lu
```

### 🏢 Agent (`/api/agent`) - Token requis
```
GET    /api/agent/dossiers                           → Tous les dossiers (filtrable)
GET    /api/agent/dossiers/soumis                    → Dossiers soumis
GET    /api/agent/dossiers/{id}                      → Détail dossier
POST   /api/agent/dossiers/{id}/prendre-en-charge    → Prendre en charge
POST   /api/agent/dossiers/{id}/valider              → Valider / Rejeter / Incomplet
GET    /api/agent/dossiers/{id}/historique           → Historique des actions
GET    /api/agent/notifications                      → Notifications
```

### 🔧 Admin (`/api/admin`) - Token requis
```
GET    /api/admin/dashboard                          → Statistiques globales
GET    /api/admin/utilisateurs                       → Tous les utilisateurs
GET    /api/admin/utilisateurs/agents                → Agents uniquement
GET    /api/admin/utilisateurs/assures               → Assurés uniquement
POST   /api/admin/utilisateurs                       → Créer utilisateur
PUT    /api/admin/utilisateurs/{id}                  → Modifier utilisateur
PATCH  /api/admin/utilisateurs/{id}/activer          → Activer compte
PATCH  /api/admin/utilisateurs/{id}/desactiver       → Désactiver compte
DELETE /api/admin/utilisateurs/{id}                  → Supprimer (soft delete)
GET    /api/admin/dossiers                           → Tous dossiers (filtrable)
GET    /api/admin/dossiers/{id}                      → Détail dossier
```

---

## 🤖 Module IA

Le service `AIAnalysisService` analyse automatiquement chaque document uploadé :

1. **Validation** : vérifie si le document est lisible et conforme au type déclaré
2. **Extraction** : détecte le montant dans le document
3. **Calcul** : calcule le remboursement selon les taux configurés

### Taux de remboursement (configurables dans `application.properties`)
| Type de document | Taux par défaut |
|-----------------|-----------------|
| Visite médicale | 70% |
| Ordonnance | 80% |
| Analyse | 75% |
| Scanner | 65% |
| Radio | 65% |

> **Note** : La version actuelle simule l'analyse IA. Pour une vraie intégration, remplacer la logique dans `AIAnalysisService.analyserDocument()` par un appel à une API Vision (OpenAI GPT-4V, Google Vision, AWS Textract, etc.)

---

## 📁 Structure du Projet

```
src/main/java/com/pfe/medical/
├── config/
│   ├── AsyncConfig.java          ← Configuration thread pool IA
│   ├── DataInitializer.java      ← Données de démo au démarrage
│   └── SecurityConfig.java       ← Spring Security + CORS + JWT
├── controller/
│   ├── AuthController.java       ← Login / Register
│   ├── AssureController.java     ← Endpoints assuré
│   ├── AgentController.java      ← Endpoints agent
│   └── AdminController.java      ← Endpoints admin
├── dto/
│   ├── request/                  ← DTOs d'entrée
│   └── response/                 ← DTOs de sortie
├── entity/
│   ├── User.java                 ← Utilisateur (Admin/Agent/Assuré)
│   ├── DossierMedical.java       ← Dossier de remboursement
│   ├── DocumentMedical.java      ← Document uploadé + résultat IA
│   ├── HistoriqueAction.java     ← Audit trail
│   └── Notification.java        ← Notifications in-app
├── enums/
│   ├── Role.java                 ← ADMIN, AGENT, ASSURE
│   ├── DossierStatus.java        ← BROUILLON, SOUMIS, EN_COURS, APPROUVE, REJETE, INCOMPLET
│   ├── DocumentType.java         ← VISITE, ORDONNANCE, ANALYSE, SCANNER, RADIO
│   └── AIValidationStatus.java  ← EN_ATTENTE, VALIDE, INVALIDE, ERREUR
├── exception/                    ← Gestion centralisée des erreurs
├── repository/                   ← JPA Repositories
├── security/
│   ├── JwtService.java           ← Génération/validation JWT
│   └── JwtAuthenticationFilter.java
└── service/impl/
    ├── AuthService.java          ← Login/Register logic
    ├── DossierService.java       ← Logique métier principale
    ├── UserService.java          ← Gestion utilisateurs
    ├── AIAnalysisService.java    ← Analyse IA des documents
    ├── FileStorageService.java   ← Stockage fichiers
    ├── NotificationService.java  ← Notifications + emails
    └── DashboardService.java     ← Statistiques
```

---

## 🔒 Sécurité

- Mots de passe hashés avec BCrypt
- Authentification stateless via JWT (Bearer token)
- Contrôle d'accès par rôle (`@PreAuthorize`)
- CORS configuré (accepte toutes origines en développement)
- Validation des fichiers (type + taille max 20MB)

---

## 📧 Configuration Email

Pour activer les notifications email, configurer dans `application.properties` :
```properties
spring.mail.username=votre_email@gmail.com
spring.mail.password=votre_app_password_gmail
```

> Créer un "App Password" Gmail : Google Account → Sécurité → Validation en 2 étapes → Mots de passe des applications

---

## 🧪 Test avec Postman / Insomnia

1. `POST /api/auth/login` avec `{"email":"admin@medical.tn","password":"Admin@123"}`
2. Copier le `accessToken` de la réponse
3. Dans les requêtes suivantes, ajouter le header : `Authorization: Bearer <token>`

---

*PFE 2025-2026 | Encadrant: HACHANI Hédi*
