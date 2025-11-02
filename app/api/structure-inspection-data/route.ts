// app/api/structure-inspection-data/route.ts
// Note : Agent IA pour structurer les données d'inspection immobilière
// Convertit le texte nettoyé en structure JSON hiérarchique pour génération Excel
// Auteur : Cascade
// Date : 31/10/2025

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Interfaces pour la structure de données
interface InspectionElement {
  type: string; // "Sol", "Mur - A", "Plafond", etc.
  substrat: string; // ex: "Plâtre", "Parquet", "PVC"
  revetement?: string; // ex: "Peinture", "PVC", "Bois"
}

interface InspectionRoom {
  name: string; // ex: "Bureau Lot 7-8"
  floor?: string | null; // étage spécifique de cette pièce (optionnel)
  elements: InspectionElement[];
}

interface InspectionData {
  floor: string | null; // ex: "Rez de chaussée" ou null si non mentionné
  rooms: InspectionRoom[];
}

export async function POST(request: Request) {
  try {
    console.log('🚀 Début de la structuration des données');

    // Parser le corps de la requête
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('✅ Corps de la requête parsé');
    } catch (parseError) {
      console.error('❌ Erreur de parsing du JSON:', parseError);
      return NextResponse.json({ success: false, error: 'Corps de la requête invalide.' }, { status: 400 });
    }

    const { cleanedText, model = 'gemini-1.5-pro' } = requestBody;

    if (!cleanedText) {
      return NextResponse.json({ success: false, error: 'Le texte nettoyé est manquant.' }, { status: 400 });
    }

    console.log(`📝 Texte à analyser (${cleanedText.length} caractères)`);

    // --- Implémentation de l'agent de structuration ---

    // Récupérer la clé d'API Gemini
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('❌ Clé API Gemini manquante');
      return NextResponse.json({ success: false, error: 'La clé API Gemini est manquante.' }, { status: 500 });
    }

    console.log('🔑 Clé API trouvée');

    // Prompt simplifié pour éviter les problèmes de parsing
    const prompt = `Analyse ce texte d'inspection et retourne UNIQUEMENT un JSON valide.

Structure requise:
{
  "floor": "ÉTAGE GLOBAL - exemple: '3ème étage', 'rez-de-chaussée', 'sous-sol', 'niveau -1', 'niveau -2'. SI AUCUN ÉTAGE GLOBAL N'EST MENTIONNÉ, LAISSER VIDE (string vide).",
  "rooms": [
    {
      "name": "nom de la pièce",
      "floor": "ÉTAGE GLOBAL - exemple: '3ème étage', 'rez-de-chaussée', 'sous-sol', 'niveau -1', 'niveau -2'. SI AUCUN ÉTAGE GLOBAL N'EST MENTIONNÉ, LAISSER VIDE (string vide).",
      "elements": [
        {"type": "Sol", "substrat": "Parquet"},
        {"type": "Mur - A", "substrat": "Plâtre", "revetement": "Peinture"},
        {"type": "Mur - B", "substrat": "Plâtre", "revetement": "Peinture"},
        {"type": "Mur - C", "substrat": "Plâtre", "revetement": "Peinture"},
        {"type": "Mur - D", "substrat": "Plâtre", "revetement": "Peinture"}
      ]
    }
  ]
}

Texte à analyser: ${cleanedText}

JSON uniquement (pas de texte, pas de backticks):`;

    // Utiliser Gemini avec le modèle spécifié
    console.log(`🤖 Utilisation de Gemini avec le modèle: ${model}`);

    let genAI, geminiModel;
    try {
      genAI = new GoogleGenerativeAI(apiKey);
      geminiModel = genAI.getGenerativeModel({
        model,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,  // Augmenté pour gérer les longues réponses
          topP: 1,
          topK: 1,
        }
      });
      console.log('✅ Client Gemini initialisé');
    } catch (initError) {
      console.error('❌ Erreur d\'initialisation Gemini:', initError);
      return NextResponse.json({ success: false, error: 'Erreur d\'initialisation de l\'API Gemini.' }, { status: 500 });
    }

    let result, response, responseText;
    try {
      result = await geminiModel.generateContent(prompt);
      response = await result.response;
      responseText = response.text().trim();
      console.log('✅ Gemini a répondu avec succès');
    } catch (geminiError) {
      console.error('❌ Erreur Gemini:', geminiError);
      return NextResponse.json({
        success: false,
        error: `Erreur de l'API Gemini: ${geminiError instanceof Error ? geminiError.message : 'Erreur inconnue'}`
      }, { status: 500 });
    }

    console.log('📄 Réponse brute de Gemini:', responseText.substring(0, 200) + '...');

    // Parser la réponse JSON avec nettoyage
    let jsonText = responseText;

    // Supprimer les éventuels textes avant/après le JSON
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}') + 1;

    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonText = jsonText.substring(jsonStart, jsonEnd);
      console.log('✅ JSON extrait du texte');
    } else {
      console.error('❌ Aucun objet JSON trouvé dans la réponse');
      return NextResponse.json({ success: false, error: 'La réponse de Gemini ne contient pas de JSON valide.' }, { status: 500 });
    }

    // Supprimer les backticks markdown si présents
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');

    let structuredData;
    try {
      structuredData = JSON.parse(jsonText);
      console.log('✅ JSON parsé avec succès');
    } catch (jsonError) {
      console.error('❌ Erreur de parsing JSON:', jsonError);
      console.error('📄 Texte qui a causé l\'erreur:', jsonText);
      return NextResponse.json({
        success: false,
        error: `JSON invalide retourné par Gemini: ${jsonError instanceof Error ? jsonError.message : 'Erreur inconnue'}`
      }, { status: 500 });
    }

    console.log('🎉 Structuration terminée avec succès');
    return NextResponse.json({ success: true, structuredData });

  } catch (error) {
    console.error("💥 Erreur inattendue lors de la structuration:", error);
    return NextResponse.json({
      success: false,
      error: `Erreur interne du serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    }, { status: 500 });
  }
}

