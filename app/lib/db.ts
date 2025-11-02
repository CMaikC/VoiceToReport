// app/lib/db.ts
// Note : Module de gestion de la base de données SQLite.
// Auteur : Cascade
// Date : 22/10/2025

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

// Variable pour conserver l'instance de la base de données en cache
let db: Database | null = null;

// Fonction pour obtenir l'instance de la base de données et l'initialiser si nécessaire
export async function getDb() {
  // Si l'instance n'est pas déjà créée, on la crée
  if (!db) {
    // Ouvre la connexion à la base de données. Le fichier sera créé s'il n'existe pas.
    const newDb = await open({
      filename: './database.sqlite', // Chemin vers le fichier de la base de données
      driver: sqlite3.Database,
    });

    // Créer la table des transcriptions si elle n'existe pas déjà
    // Activer le support des clés étrangères
    await newDb.exec('PRAGMA foreign_keys = ON;');

    // Migrations
    const audioFilesColumns = await newDb.all("PRAGMA table_info(audio_files)");
    if (!audioFilesColumns.some(col => col.name === 'size_bytes')) {
      await newDb.exec('ALTER TABLE audio_files ADD COLUMN size_bytes INTEGER');
    }
    if (!audioFilesColumns.some(col => col.name === 'parent_id')) {
      await newDb.exec('ALTER TABLE audio_files ADD COLUMN parent_id INTEGER REFERENCES audio_files(id) ON DELETE CASCADE');
    }
    if (!audioFilesColumns.some(col => col.name === 'is_transcribed')) {
      await newDb.exec('ALTER TABLE audio_files ADD COLUMN is_transcribed BOOLEAN DEFAULT FALSE');
    }
    if (!audioFilesColumns.some(col => col.name === 'mission_name')) {
      await newDb.exec('ALTER TABLE audio_files ADD COLUMN mission_name TEXT');
    }

    const transcriptionsColumns = await newDb.all("PRAGMA table_info(transcriptions)");
    if (transcriptionsColumns.some(col => col.name === 'audio_file_id')) {
      // Ancien schéma individuel, on passe à un schéma de groupe
      await newDb.exec('DROP TABLE IF EXISTS transcriptions');
    }

    // Créer la table pour les fichiers audio
    await newDb.exec(`
      CREATE TABLE IF NOT EXISTS audio_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        url TEXT NOT NULL,
        size_bytes INTEGER,
        parent_id INTEGER REFERENCES audio_files(id) ON DELETE CASCADE,
        is_transcribed BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Créer la table pour les transcriptions avec une clé étrangère
    await newDb.exec(`
      CREATE TABLE IF NOT EXISTS transcriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        audio_group_id INTEGER NOT NULL UNIQUE REFERENCES audio_files(id) ON DELETE CASCADE,
        transcription TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db = newDb;
  }
  return db;
}
