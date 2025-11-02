// app/api/transcribe/route.ts
// Note : Point de terminaison de l'API pour la transcription audio avec Whisper (local ou OpenAI).
// Auteur : Cascade
// Date : 23/10/2025

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getDb } from '@/app/lib/db';

// Initialiser le client OpenAI
// La clé API est lue depuis les variables d'environnement
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const data = await request.formData();
  const audioGroupId: string | null = data.get('audioGroupId') as string | null;
  const audioFileId: string | null = data.get('audioFileId') as string | null;
  const whisperMode: string | null = data.get('whisperMode') as string | null;

  if (!audioGroupId || !audioFileId) {
    return NextResponse.json({ success: false, error: 'ID de groupe ou de fichier manquant.' });
  }

  // Déterminer le mode de transcription (local ou online)
  const mode = whisperMode || 'online';

  // Vérifier la configuration selon le mode
  if (mode === 'online' && (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_api_key_here")) {
    return NextResponse.json({ success: false, error: 'La clé API OpenAI n-est pas configurée.' });
  }


  try {
    const db = await getDb();
    const groupId = parseInt(audioGroupId, 10);

    const fileId = parseInt(audioFileId, 10);

    // Récupérer les informations du fichier à transcrire
    const fileInfo = await db.get('SELECT * FROM audio_files WHERE id = ?', fileId);
    if (!fileInfo) {
      return NextResponse.json({ success: false, error: 'Fichier non trouvé.' });
    }

    // Récupérer le fichier et le transcrire
    const response = await fetch(new URL(fileInfo.url, request.url).toString());
    const blob = await response.blob();
    const fileToProcess = new File([blob], fileInfo.name);

    let transcriptionText: string;

    // Transcrire selon le mode sélectionné
    if (mode === 'local') {
      // Mode local : utiliser le serveur FastAPI
      const localUrl = process.env.WHISPER_LOCAL_URL || 'http://localhost:8000';
      const formData = new FormData();
      formData.append('file', fileToProcess);

      try {
        const localResponse = await fetch(`${localUrl}/transcribe`, {
          method: 'POST',
          body: formData,
        });

        if (!localResponse.ok) {
          throw new Error('Erreur lors de la transcription locale');
        }

        const localResult = await localResponse.json();
        transcriptionText = localResult.text;
      } catch (error) {
        console.error('Erreur serveur local:', error);
        return NextResponse.json({ 
          success: false, 
          error: 'Le serveur Whisper local n-est pas accessible. Vérifiez qu-il est lancé sur le port 8000.' 
        });
      }
    } else {
      // Mode online : utiliser l'API OpenAI
      const transcriptionPart = await openai.audio.transcriptions.create({
        file: fileToProcess,
        model: 'whisper-1',
      });
      transcriptionText = transcriptionPart.text;
    }
    const existingTranscription = await db.get(
      'SELECT id, transcription FROM transcriptions WHERE audio_group_id = ?',
      groupId
    );

    let newTranscriptionText: string;
    let transcriptionId: number | undefined;

    if (existingTranscription) {
      // Ajouter à la transcription existante
      newTranscriptionText = existingTranscription.transcription + '\n\n' + transcriptionText;
      await db.run('UPDATE transcriptions SET transcription = ? WHERE id = ?', newTranscriptionText, existingTranscription.id);
      transcriptionId = existingTranscription.id;
    } else {
      // Créer une nouvelle entrée de transcription
      newTranscriptionText = transcriptionText;
      const result = await db.run('INSERT INTO transcriptions (audio_group_id, transcription) VALUES (?, ?)', groupId, newTranscriptionText);
      transcriptionId = result.lastID;
    }

    // Marquer le fichier individuel comme transcrit
    await db.run('UPDATE audio_files SET is_transcribed = TRUE WHERE id = ?', fileId);

    const newTranscription = {
      id: transcriptionId,
      audio_group_id: groupId,
      transcription: newTranscriptionText,
      created_at: new Date().toISOString(),
    };

    // Renvoyer la transcription complète qui vient d'être insérée
    return NextResponse.json({ success: true, transcription: newTranscription });

  } catch (error) {
    console.error('Erreur détaillée lors de la transcription:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la communication avec la base de données.' });
  }
}
