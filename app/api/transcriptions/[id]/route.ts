// app/api/transcriptions/[id]/route.ts
// Note : Point de terminaison pour mettre à jour une transcription existante.
// Auteur : Cascade
// Date : 22/10/2025

import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: transcriptionId } = params;
  if (!transcriptionId) {
    return NextResponse.json({ success: false, error: 'ID de transcription manquant.' }, { status: 400 });
  }

  try {
    const { transcription } = await request.json();
    if (typeof transcription !== 'string') {
      return NextResponse.json({ success: false, error: 'Texte de transcription invalide.' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.run(
      'UPDATE transcriptions SET transcription = ? WHERE id = ?',
      transcription,
      transcriptionId
    );

    if (result.changes === 0) {
      return NextResponse.json({ success: false, error: 'Transcription non trouvée.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la transcription ${transcriptionId}:`, error);
    return NextResponse.json({ success: false, error: 'Erreur serveur.' }, { status: 500 });
  }
}
