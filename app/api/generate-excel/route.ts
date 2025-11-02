// app/api/generate-excel/route.ts
// Note : API pour générer les fichiers Excel d'inspection immobilière
// Crée deux fichiers Excel : liste des pièces et description des pièces
// Auteur : Cascade
// Date : 31/10/2025

import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Interfaces pour la structure de données
interface InspectionElement {
  type: string;
  substrat: string;
  revetement?: string;
}

interface InspectionRoom {
  name: string;
  floor?: string | null; // étage spécifique de cette pièce (optionnel)
  elements: InspectionElement[];
}

interface InspectionData {
  floor: string | null;
  rooms: InspectionRoom[];
}

// Fonction pour générer une clé composant unique
function generateComponentKey(index: number = 0): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  // Générer un nombre aléatoire pour s'assurer de l'unicité
  const random = Math.floor(Math.random() * 100000000000000);

  return `${year}_${month}_${day}_${hours}_${minutes}_${seconds}_${milliseconds}${random}${index}`;
}

export async function POST(request: Request) {
  try {
    const { structuredData }: { structuredData: InspectionData } = await request.json();

    if (!structuredData) {
      return NextResponse.json({ success: false, error: 'Les données structurées sont manquantes.' }, { status: 400 });
    }

    // Générer les données pour le premier fichier Excel : Liste des pièces
    const roomsData = generateRoomsExcelData(structuredData);

    // Générer les données pour le deuxième fichier Excel : Description des pièces
    const descriptionsData = generateDescriptionsExcelData(structuredData);

    // Créer le premier workbook (Liste des pièces)
    const roomsWorkbook = XLSX.utils.book_new();
    const roomsWorksheet = XLSX.utils.json_to_sheet(roomsData, {
      header: [
        'id_classement_champs',
        'Lot',
        'PieceHorsCREP',
        'PieceExterieure',
        'ClefComposant',
        'Batiment',
        'Local',
        'Justification',
        'MoyenAMettreEnOeuvre'
      ]
    });
    XLSX.utils.book_append_sheet(roomsWorkbook, roomsWorksheet, 'Liste des pieces');

    // Créer le deuxième workbook (Description des pièces)
    const descriptionsWorkbook = XLSX.utils.book_new();
    const descriptionsWorksheet = XLSX.utils.json_to_sheet(descriptionsData, {
      header: [
        'id_classement_champs',
        'ClefComposant',
        'Localistion',
        'Informations',
        'Type',
        'CREP_degradation',
        'CREP_degradation_Details',
        'CREP_mesure',
        'Data_1',
        'Data_2',
        'Data_3',
        'Data_4'
      ]
    });
    XLSX.utils.book_append_sheet(descriptionsWorkbook, descriptionsWorksheet, 'Description des pieces');

    // Générer les buffers Excel et les convertir en base64
    const roomsBuffer = XLSX.write(roomsWorkbook, { type: 'buffer', bookType: 'xlsx' });
    const descriptionsBuffer = XLSX.write(descriptionsWorkbook, { type: 'buffer', bookType: 'xlsx' });

    // Convertir en base64 pour transmission
    const roomsBase64 = Buffer.from(roomsBuffer).toString('base64');
    const descriptionsBase64 = Buffer.from(descriptionsBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      files: {
        rooms: {
          data: roomsBase64,
          filename: 'Liste_des_pieces.xlsx'
        },
        descriptions: {
          data: descriptionsBase64,
          filename: 'Description_des_pieces.xlsx'
        }
      }
    });

  } catch (error) {
    console.error("Erreur lors de la génération des fichiers Excel:", error);
    return NextResponse.json({ success: false, error: "Erreur interne du serveur." }, { status: 500 });
  }
}

// Générer les données pour le fichier "Liste des pièces"
function generateRoomsExcelData(data: InspectionData): any[] {
  const rows: any[] = [];

  // Données des pièces (sans en-tête, XLSX les crée automatiquement)
  data.rooms.forEach((room, index) => {
    rows.push({
      'id_classement_champs': String(index).padStart(5, '0'),
      'Lot': '',
      'PieceHorsCREP': '',
      'PieceExterieure': '',
      'ClefComposant': generateComponentKey(index),
      'Batiment': room.floor || data.floor || '',
      'Local': room.name,
      'Justification': '',
      'MoyenAMettreEnOeuvre': ''
    });
  });

  return rows;
}

// Générer les données pour le fichier "Description des pièces"
function generateDescriptionsExcelData(data: InspectionData): any[] {
  const rows: any[] = [];

  let elementIndex = 0;

  // Données des éléments de chaque pièce (sans en-tête, XLSX les crée automatiquement)
  data.rooms.forEach((room) => {
    room.elements.forEach((element) => {
      // Construire la description des informations
      let informations = `Substrat : ${element.substrat}`;
      if (element.revetement) {
        informations += ` - Revêtement : ${element.revetement}`;
      }

      rows.push({
        'id_classement_champs': String(elementIndex).padStart(5, '0'),
        'ClefComposant': generateComponentKey(elementIndex++),
        'Localistion': (room.floor || data.floor) ? `${room.floor || data.floor} - ${room.name}` : room.name,
        'Informations': informations,
        'Type': element.type,
        'CREP_degradation': '',
        'CREP_degradation_Details': '',
        'CREP_mesure': '',
        'Data_1': '',
        'Data_2': '',
        'Data_3': '',
        'Data_4': ''
      });
    });
  });

  return rows;
}
