// app/api/files/[filename]/route.ts
// Note : Point de terminaison pour supprimer un fichier audio spécifique.
// Auteur : Cascade
// Date : 22/10/2025

import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { getDb } from '@/app/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;
  if (!filename) {
    return NextResponse.json({ success: false, error: 'Nom de fichier manquant.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { missionName } = body;

    if (missionName === undefined) {
      return NextResponse.json({ success: false, error: 'Nom de mission manquant.' }, { status: 400 });
    }

    const db = await getDb();

    // Mettre à jour le nom de la mission pour le fichier (parent ou enfant)
    const result = await db.run(
      'UPDATE audio_files SET mission_name = ? WHERE name = ?',
      missionName || null,
      filename
    );

    if (result.changes === 0) {
      return NextResponse.json({ success: false, error: 'Fichier non trouvé ou mise à jour échouée.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du nom de mission:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la mise à jour.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;
  if (!filename) {
    return NextResponse.json({ success: false, error: 'Nom de fichier manquant.' }, { status: 400 });
  }

  try {
    const db = await getDb();

    // 1. Trouver le fichier parent et tous ses enfants
    const parentFile = await db.get('SELECT * FROM audio_files WHERE name = ? AND parent_id IS NULL', filename);
    if (!parentFile) {
      return NextResponse.json({ success: false, error: 'Fichier principal non trouvé.' }, { status: 404 });
    }

    const childFiles = await db.all('SELECT * FROM audio_files WHERE parent_id = ?', parentFile.id);
    const filesToDelete = [parentFile, ...childFiles];

    // 2. Supprimer chaque fichier physique
    for (const file of filesToDelete) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', file.name);
      try {
        await unlink(filePath);
        console.log(`Fichier supprimé du disque: ${filePath}`);
      } catch (fileError) {
        // Ignorer l'erreur si le fichier n'existe pas, sinon la journaliser
        if ((fileError as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error(`Impossible de supprimer le fichier ${file.name}:`, fileError);
        }
      }
    }

    // 3. Supprimer l'enregistrement parent de la DB (les enfants suivront en cascade)
    await db.run('DELETE FROM audio_files WHERE id = ?', parentFile.id);
    console.log(`Groupe de fichiers pour ${filename} supprimé de la base de données.`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Erreur lors de la suppression du fichier ${filename}:`, error);
    // Gérer le cas où le fichier n'existe déjà plus
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ success: true, message: 'Le fichier n-existait déjà pas.' });
    }
    return NextResponse.json({ success: false, error: 'Erreur serveur.' }, { status: 500 });
  }
}
