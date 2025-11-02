# Serveur Whisper Local

Ce serveur FastAPI permet de faire de la transcription audio en local avec Whisper.

## Installation

1. Créer un environnement virtuel Python :
```bash
cd whisper-server
python -m venv venv
```

2. Activer l'environnement virtuel :
- Windows : `venv\Scripts\activate`
- Linux/Mac : `source venv/bin/activate`

3. Installer les dépendances :
```bash
pip install -r requirements.txt
```

## Lancement du serveur

```bash
python main.py
```

Le serveur sera accessible sur `http://localhost:8000`

## Endpoints

- `GET /` : Vérifier que le serveur fonctionne
- `GET /health` : Vérifier l'état du serveur
- `POST /transcribe` : Transcrire un fichier audio

## Notes

- Le modèle Whisper 'base' est utilisé par défaut (bon compromis vitesse/qualité)
- Vous pouvez changer le modèle dans `main.py` (tiny, small, medium, large)
- Le serveur accepte les requêtes CORS depuis `http://localhost:3000`
