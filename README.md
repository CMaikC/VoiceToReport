# Documentation Technique de VoiceToReport

## 1. Vue d'ensemble

VoiceToReport est une application web front-end construite avec **Next.js** et **TypeScript**. Elle permet aux utilisateurs d'enregistrer de l'audio depuis leur microphone, de téléverser des fichiers audio, de les transcrire en texte via l'API Whisper d'OpenAI, et de conserver un historique des transcriptions et des fichiers audio.

L'application est conçue pour fonctionner entièrement côté client, sans base de données serveur. Le stockage des données est géré par les technologies de stockage du navigateur : **IndexedDB** pour les fichiers audio et **LocalStorage** pour l'historique des transcriptions.

## 2. Technologies et Bibliothèques Clés

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Langage**: [TypeScript](https://www.typescriptlang.org/)
- **Interface Utilisateur**: [shadcn/ui](https://ui.shadcn.com/) (composants Radix UI + Tailwind CSS)
- **Enregistrement Audio**: `mic-recorder-to-mp3` - Une bibliothèque JavaScript qui gère l'accès au microphone et encode l'audio directement au format MP3 dans le navigateur.
- **Lecture Audio**: `howler.js` - Une bibliothèque audio robuste pour le web, utilisée pour une lecture fiable des fichiers audio, indépendamment du format.
- **Stockage des Fichiers Audio**: `IndexedDB` via la bibliothèque `idb` - Une base de données de bas niveau dans le navigateur, idéale pour stocker de grandes quantités de données comme des fichiers (Blobs).
- **Stockage des Transcriptions**: `LocalStorage` - Un simple stockage clé-valeur dans le navigateur, utilisé pour conserver l'historique des textes de transcription.
- **API de Transcription**: [OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text)

## 3. Gestion des Fichiers Audio

C'est un aspect central de l'application. La gestion des fichiers audio est conçue pour être robuste et entièrement côté client.

### 3.1. Format des Fichiers

- **Format d'Enregistrement**: L'application utilise la bibliothèque `mic-recorder-to-mp3` pour enregistrer l'audio directement au format **MP3** (`audio/mp3`). Ce format a été choisi pour sa compatibilité universelle avec l'API d'OpenAI et les lecteurs audio.
- **Format de Téléversement**: L'application accepte tous les formats audio (`audio/*`). Cependant, la compatibilité avec l'API Whisper dépend des formats qu'elle supporte (MP3, WAV, M4A, etc.).

### 3.2. Stockage des Fichiers Audio (IndexedDB)

Les fichiers audio ne sont **pas** stockés sur un serveur. Ils sont sauvegardés dans la base de données **IndexedDB** du navigateur de l'utilisateur.

- **Fonctionnement**: Chaque fois qu'un fichier est enregistré ou téléversé, il est ajouté à la base de données IndexedDB sous forme de `Blob`.
- **Structure des Données**: Chaque enregistrement dans la base contient :
  - `id`: Un identifiant unique (timestamp ISO).
  - `name`: Le nom du fichier (ex: `enregistrement-2025-10-22T08:00:00.000Z.mp3`).
  - `blob`: Le contenu binaire du fichier audio.
  - `date`: La date de création lisible.
- **Avantages**: IndexedDB permet de stocker plusieurs mégaoctets (voire gigaoctets, selon le navigateur) de données de manière persistante, ce qui est idéal pour les fichiers audio.
- **Localisation**: Ces données sont stockées dans le profil de l'utilisateur du navigateur (ex: dans les fichiers de profil de Chrome, Firefox, etc.). Elles sont spécifiques à un navigateur et à un domaine (URL de l'application).

## 4. Gestion de l'Historique des Transcriptions

L'historique des textes de transcription est géré via le **LocalStorage** du navigateur.

- **Fonctionnement**: Après chaque transcription réussie, le texte est ajouté à un tableau d'objets en JavaScript.
- **Structure des Données**: Chaque élément de l'historique contient :
  - `id`: Un identifiant unique (timestamp ISO).
  - `text`: Le contenu de la transcription.
  - `date`: La date de la transcription.
- **Persistance**: Ce tableau est ensuite sérialisé en chaîne de caractères JSON et sauvegardé dans `localStorage` sous la clé `transcriptionHistory`. Au chargement de la page, cette clé est lue pour restaurer l'historique.
- **Limites**: Le LocalStorage est limité à environ 5-10 Mo, ce qui est largement suffisant pour des milliers de transcriptions textuelles.

## 5. Architecture et Flux de Données

1.  **Initialisation**: Au chargement, l'application initialise l'enregistreur audio et charge les historiques (audio et texte) depuis IndexedDB et LocalStorage.
2.  **Création d'un Audio**:
    - **Enregistrement**: L'utilisateur clique sur "Démarrer". `mic-recorder-to-mp3` capture l'audio. Au clic sur "Arrêter", la bibliothèque encode un `Blob` MP3.
    - **Téléversement**: L'utilisateur sélectionne un fichier. Un `File` (qui est un type de `Blob`) est créé.
3.  **Sauvegarde**: Le `Blob` audio est sauvegardé dans IndexedDB via l'utilitaire `lib/db.ts`. La liste dans l'interface est mise à jour.
4.  **Lecture**: L'utilisateur clique sur "Écouter". Le `Blob` est lu depuis IndexedDB, une URL d'objet (`URL.createObjectURL`) est générée et passée au lecteur `howler.js`.
5.  **Transcription**:
    - L'utilisateur sélectionne un audio et clique sur "Lancer la Transcription".
    - Le `File` ou `Blob` est ajouté à un objet `FormData`.
    - Une requête `POST` est envoyée au point de terminaison de l'API Next.js `/api/transcribe`.
    - Le serveur Next.js reçoit le fichier et le transmet à l'API Whisper d'OpenAI.
    - La transcription textuelle est renvoyée au client.
6.  **Sauvegarde de la Transcription**: Le texte reçu est affiché et ajouté à l'historique, qui est ensuite sauvegardé dans LocalStorage.

## 6. Configuration

Pour activer la fonctionnalité d'extraction de données basée sur l'IA, vous devez fournir une clé d'API pour le modèle de langage (par exemple, Google Gemini).

1.  Créez un fichier `.env.local` à la racine du projet s'il n'existe pas.
2.  Ajoutez la ligne suivante à ce fichier en remplaçant `VOTRE_CLÉ_ICI` par votre clé d'API réelle:

    ```
    GEMINI_API_KEY="VOTRE_CLÉ_ICI"
    ```

L'application utilisera cette clé pour communiquer avec l'API du modèle de langage.

## 7. Démarrage du Projet

Pour lancer le projet en mode développement, exécutez la commande suivante :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.
