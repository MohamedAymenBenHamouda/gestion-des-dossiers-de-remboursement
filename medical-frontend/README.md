# 🏥 MedRembours — Frontend Angular 17

Interface web complète du système de gestion des dossiers de remboursement médical.

---

## 🛠️ Stack

- **Angular 17** (Standalone Components, Signals)
- **SCSS** (design system complet)
- **JWT** authentication
- **Lazy loading** des modules

---

## 🚀 Démarrage dans IntelliJ IDEA

### Prérequis
- **Node.js 18+** : https://nodejs.org
- **npm** inclus avec Node.js

### 1. Ouvrir le terminal dans IntelliJ

`View → Tool Windows → Terminal`

### 2. Installer les dépendances

```bash
npm install
```

### 3. Lancer l'application

```bash
npm start
```

L'application démarre sur **http://localhost:4200**

> ⚠️ Le backend Spring Boot doit être lancé sur `http://localhost:8080`

---

## 👤 Comptes de démonstration

Sur la page de login, cliquez sur les boutons de démonstration :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| 👑 Admin | admin@medical.tn | Admin@123 |
| 🏢 Agent | agent@medical.tn | Agent@123 |
| 👤 Assuré | assure@medical.tn | Assure@123 |

---

## 📱 Fonctionnalités par rôle

### 👤 Assuré
- Dashboard avec résumé de ses dossiers
- Créer un dossier de remboursement
- Uploader des documents (Drag & Drop)
- Voir l'analyse IA de ses documents
- Soumettre / Re-soumettre un dossier
- Voir les messages de l'agent
- Historique des remboursements

### 🏢 Agent
- Dashboard avec dossiers en attente
- Prendre en charge un dossier
- Approuver / Rejeter / Marquer incomplet
- Envoyer un message à l'assuré si incomplet

### 👑 Admin
- Dashboard statistiques
- Gérer les comptes (agents + assurés)
- Voir tous les dossiers

---

## 📁 Structure du projet

```
src/app/
├── core/
│   ├── guards/           ← Auth guard
│   ├── interceptors/     ← JWT interceptor
│   ├── models/           ← Interfaces TypeScript
│   └── services/         ← AuthService, ApiService
├── features/
│   ├── auth/             ← Login, Register
│   ├── admin/            ← Dashboard admin, Utilisateurs, Dossiers
│   ├── agent/            ← Dashboard agent, Dossiers
│   └── assure/           ← Dashboard, Dossiers, Détail dossier
└── shared/
    └── pipes/            ← Pipes: statusLabel, currency2, shortDate...
```

---

## ⚙️ Configuration

Pour changer l'URL du backend, modifier :

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'  // ← Modifier ici
};
```

---

*PFE 2025-2026 | Encadrant: HACHANI Hédi*
