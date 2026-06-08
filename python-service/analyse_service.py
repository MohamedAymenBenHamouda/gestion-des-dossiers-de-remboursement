import os, io, json, re, logging, time
from pathlib import Path
from google import genai
from google.genai import types
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

# Configuration de l'environnement
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / '.env'
    load_dotenv(dotenv_path=env_path)
    print(f"Fichier .env chargé")
except ImportError:
    print("python-dotenv manquant")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "INVALID_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)


MODELS_FALLBACK = ["gemini-2.5-flash"]

TYPE_LABELS = {
    "ORDONNANCE": "Ordonnance médicale",          
    "ORDONNANCE_MEDECIN": "Ordonnance médicale",
    "FACTURE_PHARMACIE": "Facture de pharmacie",
    "FACTURE_CONSULTATION": "Facture de consultation",
    "FACTURE_RADIO": "Facture de radiologie",
    "FACTURE_SCANNER": "Facture de scanner/IRM",
    "FACTURE_ANALYSE_LABO": "Facture d'analyses laboratoire",
    "FACTURE_DENTAIRE": "Facture de soins dentaires",
    "FACTURE_OPTIQUE": "Facture d'optimique",
    "FACTURE_HOSPITALISATION": "Facture d'hospitalisation",
    "BULLETIN_SORTIE": "Bulletin de sortie",
    "AUTRE": "Document médical autre",
}

# Types qui correspondent à une ordonnance (consultation sans montant facturé)
ORDONNANCE_TYPES = {"ORDONNANCE", "ORDONNANCE_MEDECIN"}

# Constantes CNAM
BASE_GENERALISTE = 40.0
BASE_SPECIALISTE = 50.0
PLAFOND_OPTIQUE = 200.0

app = FastAPI(title="Analyse IA Factures Médicales", version="3.2")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def optimiser_image(contenu_original):
    """Réduit la taille de l'image pour accélérer l'IA et éviter les timeouts"""
    try:
        img = Image.open(io.BytesIO(contenu_original))
        # Convertir en RGB si nécessaire (pour les PNG/RGBA)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        
        # Redimensionnement max 1600px (suffisant pour l'OCR)
        img.thumbnail((1600, 1600))
        
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85, optimize=True)
        return buffer.getvalue()
    except Exception as e:
        logger.warning(f"Échec optimisation image : {e}. Envoi original.")
        return contenu_original


@app.post("/analyser")
async def analyser(
    fichier: UploadFile = File(...),
    type_document: str = Form(default="AUTRE"),
    dossier_ald: str = Form(default="false"),
    patient_attendu: str = Form(default="")
):
    if GEMINI_API_KEY == "INVALID_KEY":
        return _erreur("Clé API non configurée")

    contenu = await fichier.read()
    
    is_image = fichier.content_type.startswith("image/")
    if is_image:
        contenu = optimiser_image(contenu)

    type_label = TYPE_LABELS.get(type_document, "Document médical")
    
    patient_instruction = f'\n    VERIFICATION OBLIGATOIRE PATIENT :\n    - Le nom et prénom du patient sur le document DOIT correspondre à : "{patient_attendu}". Si le nom ne correspond pas, tu DOIS mettre "est_valide": false et indiquer "motif_rejet": "Le patient sur le document ne correspond pas au bénéficiaire sélectionné.".' if patient_attendu else ''
    
    type_instruction = f'\n    VERIFICATION OBLIGATOIRE TYPE DOCUMENT :\n    - Le document analysé DOIT être de type : "{type_label}" (type interne : {type_document}). Si ce n\'est manifestement pas le cas, tu DOIS mettre "est_valide": false et indiquer "motif_rejet": "Le type de document soumis ne correspond pas au type sélectionné.".'

    prompt = f"""
    Analyse ce document médical tunisien ({type_label}).
    Réponds UNIQUEMENT en JSON valide.
    Structure : {{
      "est_valide": true,
      "motif_rejet": "...",
      "type_soin_detecte": "CONSULTATION | HOSPITALISATION | OPTIQUE | DENTAIRE | PHARMACIE | ALD | AUTRE",
      "type_medecin": "GENERALISTE | SPECIALISTE | null",
      "patient": {{"nom": "...", "numero_assurance": "..."}},
      "prestataire": {{"nom": "...", "medecin": "..."}},
      "facture": {{"date": "...", "montant_ttc": 0.0}},
      "score_confiance": 0.9
    }}
    Règle : Si millimes (ex: 40000), convertir en dinars (40.000).{patient_instruction}{type_instruction}
    """

    
    raw_response = None
    nb_tentatives = 5
    
    for i in range(nb_tentatives):
        model_name = MODELS_FALLBACK[i % len(MODELS_FALLBACK)]
        
        try:
            logger.info(f" Tentative {i+1}/{nb_tentatives} avec {model_name}...")
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    types.Part.from_text(text=prompt),
                    types.Part.from_bytes(data=contenu, mime_type="image/jpeg" if is_image else "application/pdf"),
                ]
            )
            raw_response = response.text.strip()
            logger.info(f" Succès avec {model_name}")
            break # On sort de la boucle si ça marche

        except Exception as e:
            err_msg = str(e)
            if ("503" in err_msg or "429" in err_msg) and i < nb_tentatives - 1:
                # Calcul de l'attente exponentielle : 10s, 20s, 40s...
                wait_time = (2 ** i) * 10
                logger.warning(f"Modèle saturé (503/429). Pause de {wait_time}s...")
                time.sleep(wait_time)
            else:
                logger.error(f" Erreur Gemini : {err_msg}")
                return _erreur(f"Service indisponible : {err_msg}")

    if not raw_response:
        return _erreur("Échec de communication avec l'IA après plusieurs essais.")

    try:
        clean_json = re.sub(r"```json|```", "", raw_response).strip()
        data = json.loads(clean_json)
        # parser le flag dossier_ald envoyé par le front (true/false/1)
        ald_flag = str(dossier_ald).strip().lower() in ("1", "true", "yes", "on")
        return _calculer_remboursement(data, type_document, ald_flag, patient_attendu)
    except Exception as e:
        return _erreur(f"Erreur de lecture des données IA : {e}")


def _calculer_remboursement(data: dict, type_document: str = "AUTRE", dossier_ald: bool = False, patient_attendu: str = "") -> dict:
    est_valide = bool(data.get("est_valide", False))
    type_soin = str(data.get("type_soin_detecte", "")).upper()
    type_medecin = str(data.get("type_medecin", "")).upper()
    
    facture = data.get("facture", {})
    montant_ttc = _montant(facture.get("montant_ttc"))
    
    montant_rembourse = 0.0
    taux = 0.0
    # Détection robuste d'ALD (maladie chronique) — recherche dans plusieurs champs
    is_ald = False
    if "ALD" in type_soin or "MALADIE" in type_soin:
        is_ald = True
    # vérifier d'autres champs courants renvoyés par l'IA
    for key in ("type_soin_detecte", "type_medecin", "diagnostic", "notes", "commentaires"):
        try:
            if "ALD" in str(data.get(key, "")).upper() or "MALADIE" in str(data.get(key, "")).upper():
                is_ald = True
                break
        except Exception:
            continue
    # override si le front indique explicitement que le dossier est ALD
    if dossier_ald:
        is_ald = True
    
    # ── Détecter si c'est une ordonnance (consultation sans montant facturé) ─
    is_ordonnance = type_document.upper() in ORDONNANCE_TYPES
    is_consultation = "CONSULTATION" in type_soin
    
    if est_valide:
        # Si dossier/soin identifié ALD -> prise en charge 100% quel que soit le type
        if is_ald and montant_ttc > 0:
            montant_rembourse = montant_ttc
            taux = 1.0
        else:
            if is_ordonnance or is_consultation:
                # Remboursement FIXE CNAM : 40 DT généraliste / 50 DT spécialiste
                # Pas besoin de montant TTC — c'est un forfait consultation
                base = BASE_SPECIALISTE if "SPECIALISTE" in type_medecin else BASE_GENERALISTE
                if montant_ttc > 0:
                    # Facture de consultation avec montant → on plafonne au barème
                    montant_rembourse = min(montant_ttc, base)
                else:
                    # Ordonnance sans montant → forfait direct
                    montant_rembourse = base
                taux = 1.0
            elif montant_ttc > 0:
                if type_soin == "PHARMACIE":
                    montant_rembourse = montant_ttc * 0.80
                    taux = 0.80
                elif type_soin == "DENTAIRE":
                    montant_rembourse = montant_ttc * 0.60
                    taux = 0.60
                elif type_soin == "OPTIQUE":
                    montant_rembourse = min(montant_ttc, PLAFOND_OPTIQUE)
                    taux = 1.0  # Plafond fixe
                elif type_soin == "ALD":
                    # Maladie de longue durée (ALD) : assuré prend 100% du remboursement
                    montant_rembourse = montant_ttc
                    taux = 1.0
                else:
                    montant_rembourse = montant_ttc * 0.50
                    taux = 0.50
            
    data["remboursement"] = {
        "montant_facture": montant_ttc,
        "montant_rembourse": round(montant_rembourse, 3),
        "taux_applique": taux,
        "ald": bool(is_ald)
    }
    data["rapport"] = _generer_rapport(data)
    return data

def _montant(val) -> float:
    if not val: return 0.0
    try:
        # Nettoyage et conversion millimes/dinars
        num = float(re.sub(r"[^\d.]", "", str(val).replace(",", ".")))
        return round(num / 1000.0, 3) if num > 10000 else round(num, 3)
    except: return 0.0

def _generer_rapport(data: dict) -> str:
    r = data.get("remboursement", {})
    if not data.get("est_valide"): 
        motif = data.get("motif_rejet", "Document non valide, illisible ou ne correspond pas au patient/type attendu.")
        return f" Rejeté : {motif}"
    parts = [f"Analyse Terminée",
             f"🏥 Prestataire : {data.get('prestataire',{}).get('nom')}",
             f"💶 Total : {r.get('montant_facture'):.3f} TND",
             f"💚 Remboursement estimé : {r.get('montant_rembourse'):.3f} TND"]
    if r.get('ald'):
        parts.append("🩺 ALD — prise en charge 100%")
    return "\n".join(parts)

def _erreur(msg: str) -> dict:
    return {"est_valide": False, "motif_rejet": msg, "rapport": f"⚠️ Erreur : {msg}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)