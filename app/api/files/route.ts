// app/api/files/route.ts
// Note : Point de terminaison pour lister les fichiers audio du serveur.
// Auteur : Cascade
// Date : 22/10/2025

import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';

export interface AudioFile {
  id: number;
  name: string;
  url: string;
  created_at: string;
  transcription: string | null;
  size_bytes: number | null;
  parent_id: number | null;
  children?: AudioFile[];
  is_transcribed?: boolean;
  transcription_id?: number;
  mission_name?: string | null;
}

export async function GET() {
  try {
    const db = await getDb();
    const allFiles: AudioFile[] = await db.all(`
      SELECT
        a.id, a.name, a.url, a.created_at, a.size_bytes, a.parent_id, a.is_transcribed, a.mission_name,
        t.transcription, t.id as transcription_id
      FROM audio_files a
      LEFT JOIN transcriptions t ON a.id = t.audio_group_id
      ORDER BY a.created_at ASC
    `);

    const fileMap = new Map<number, AudioFile>();
    const rootFiles: AudioFile[] = [];

    allFiles.forEach(file => {
      file.children = [];
      fileMap.set(file.id, file);
    });

    allFiles.forEach(file => {
      if (file.parent_id) {
        const parent = fileMap.get(file.parent_id);
        parent?.children?.push(file);
      } else {
        rootFiles.push(file);
      }
    });

    return NextResponse.json({ success: true, files: rootFiles.reverse() });
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers audio:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur.' }, { status: 500 });
  }
}
