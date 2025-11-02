# whisper-server/main.py
# Note : Serveur FastAPI pour la transcription audio locale avec Whisper
# Auteur : Cascade
# Date : 23/10/2025

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import whisper
import tempfile
import os
import warnings
from pathlib import Path

# Supprimer l'avertissement FP16/FP32 (normal sur CPU)
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU")

# Initialiser FastAPI
app = FastAPI(title="Whisper Local Server")

# Configuration CORS pour permettre les requêtes depuis Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # URL de votre app Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Charger le modèle Whisper au démarrage (utilise le modèle 'base' par défaut)
# Vous pouvez changer pour 'tiny', 'small', 'medium', 'large' selon vos besoins
print("Chargement du modèle Whisper...")
model = whisper.load_model("small")
print("Modèle Whisper chargé avec succès!")

@app.get("/")
async def root():
    """Point de terminaison racine pour vérifier que le serveur fonctionne"""
    return {"message": "Serveur Whisper local opérationnel", "model": "base"}

@app.get("/health")
async def health_check():
    """Vérification de l'état du serveur"""
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcrit un fichier audio en utilisant Whisper local
    
    Args:
        file: Fichier audio uploadé (formats supportés: mp3, wav, m4a, etc.)
    
    Returns:
        dict: Contient le texte transcrit
    """
    try:
        # Créer un fichier temporaire pour sauvegarder l'audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
            # Lire et écrire le contenu du fichier uploadé
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Transcrire avec Whisper
            print(f"Transcription du fichier: {file.filename}")
            result = model.transcribe(temp_file_path, language="fr")  # Forcer le français
            
            return {
                "text": result["text"],
                "language": result.get("language", "fr"),
                "success": True
            }
        
        finally:
            # Nettoyer le fichier temporaire
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except Exception as e:
        print(f"Erreur lors de la transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de transcription: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Lancer le serveur sur le port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
