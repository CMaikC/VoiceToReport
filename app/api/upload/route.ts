// app/api/upload/route.ts
// Note : Point de terminaison pour téléverser et sauvegarder les fichiers audio sur le serveur.
// Auteur : Cascade
// Date : 22/10/2025

import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { getDb } from '@/app/lib/db';

export async function POST(request: Request) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;
  const parentId: string | null = data.get('parentId') as string | null;
  const missionName: string | null = data.get('missionName') as string | null;

  if (!file) {
    return NextResponse.json({ success: false, error: 'Aucun fichier fourni.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Le chemin où le fichier sera sauvegardé
  const filePath = path.join(process.cwd(), 'public', 'uploads', file.name);

  try {
    await writeFile(filePath, buffer);
    console.log(`Fichier sauvegardé sur: ${filePath}`);

    // Insérer les informations du fichier dans la base de données
    const db = await getDb();
    const url = `/uploads/${file.name}`;
    const result = await db.run(
      'INSERT INTO audio_files (name, url, size_bytes, parent_id, mission_name) VALUES (?, ?, ?, ?, ?)',
      file.name,
      url,
      file.size,
      parentId ? parseInt(parentId, 10) : null,
      missionName || null
    );

    const newAudioFile = {
      id: result.lastID,
      name: file.name,
      url: url,
      size_bytes: file.size,
      created_at: new Date().toISOString(),
      parent_id: parentId ? parseInt(parentId, 10) : null,
      mission_name: missionName,
    };

    return NextResponse.json({ success: true, file: newAudioFile });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du fichier:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la sauvegarde du fichier.' }, { status: 500 });
  }
}
