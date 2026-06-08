# SOLUTION ANALYSE IA — Factures Médicales
# Architecture : Spring Boot → Python FastAPI → Gemini Vision

## POURQUOI CETTE ARCHITECTURE ?

Spring Boot seul → Gemini : problèmes de timeout, encodage base64, RestTemplate
Python → Gemini : SDK officiel google-generativeai, 10 lignes, ça marche

## STRUCTURE
  python-service/
    analyse_service.py   ← Microservice Python (port 8001)
    requirements.txt     ← Dépendances Python

  spring-integration/
    AIAnalysisService.java ← Spring Boot appelle Python via HTTP

## ÉTAPE 1 — Clé API Gemini (GRATUIT)
  1. Allez sur : https://aistudio.google.com/app/apikey
  2. Cliquez "Create API Key"
  3. Copiez la clé (commence par AIzaSy...)

## ÉTAPE 2 — Installer Python + dépendances
  # Windows :
  python --version  # vérifier Python 3.9+
  pip install fastapi uvicorn google-generativeai pillow python-multipart

  # Ou avec requirements.txt :
  pip install -r requirements.txt

## ÉTAPE 3 — Démarrer le microservice Python
  cd python-service

  # Windows (CMD) :
  set GEMINI_API_KEY=AIzaSy_VOTRE_CLE
  python analyse_service.py

  # Windows (PowerShell) :
  $env:GEMINI_API_KEY="AIzaSy_VOTRE_CLE"
  python analyse_service.py

  # Linux/Mac :
  GEMINI_API_KEY=AIzaSy_VOTRE_CLE python analyse_service.py

  → Service disponible sur http://localhost:8001
  → Test santé : http://localhost:8001/health

## ÉTAPE 4 — Configurer Spring Boot
  Ajouter dans application.properties :
    ai.service.url=http://localhost:8001

## ÉTAPE 5 — Remplacer AIAnalysisService.java
  Copier spring-integration/...AIAnalysisService.java
  dans votre projet Spring Boot

## UTILISATION
  Quand l'assuré uploade une image :
  1. Spring Boot sauvegarde l'image sur disque
  2. Appelle AIAnalysisService.analyserDocument()
  3. Spring Boot envoie l'image au microservice Python (localhost:8001)
  4. Python appelle Gemini Vision avec le prompt médical
  5. Gemini analyse et retourne :
     - est_valide: true/false (est-ce une vraie facture ?)
     - montant_facture: ex 85.500 TND
     - montant_rembourse: ex 59.850 TND (70%)
     - rapport: texte lisible pour l'agent
  6. Spring Boot sauvegarde le résultat en base

## TEST RAPIDE (sans Spring Boot)
  # Tester le microservice directement :
  curl -X POST http://localhost:8001/analyser \
    -F "fichier=@facture.jpg" \
    -F "type_document=VISITE_MEDICALE"

## RÉSULTAT EXEMPLE
  {
    "est_valide": true,
    "montant_facture": 85.500,
    "montant_rembourse": 59.850,
    "taux_applique": 0.70,
    "score_confiance": 0.93,
    "etablissement": "Clinique Les Oliviers Tunis",
    "date_document": "15/03/2026",
    "rapport": "✅ Facture médicale validée par Gemini IA.\n🏥 Établissement : Clinique Les Oliviers\n💰 Montant facturé : 85.500 TND\n💚 Remboursement estimé (70%) : 59.850 TND\n📊 Confiance IA : 93%"
  }
