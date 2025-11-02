// app/api/history/route.ts
// Note : API pour gérer l'historique des transcriptions.
// Auteur : Cascade
// Date : 22/10/2025

import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';

// Gérer les requêtes GET pour récupérer tout l'historique
export async function GET() {
  try {
    const db = await getDb();
    // Sélectionner toutes les transcriptions, triées par date de création (les plus récentes en premier)
    const history = await db.all('SELECT id, audio_filename, transcription, created_at FROM transcriptions ORDER BY created_at DESC');
    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    return NextResponse.json({ success: false, error: 'Erreur serveur.' }, { status: 500 });
  }
}

// Gérer les requêtes DELETE pour supprimer un élément de l'historique
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID manquant.' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.run('DELETE FROM transcriptions WHERE id = ?', id);

    // Vérifier si une ligne a bien été supprimée
    if (result.changes === 0) {
      return NextResponse.json({ success: false, error: 'Transcription non trouvée.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'élément de l'historique:", error);
    return NextResponse.json({ success: false, error: 'Erreur serveur.' }, { status: 500 });
  }
}
