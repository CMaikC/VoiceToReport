// app/api/clean-transcription/route.ts
// Note : Agent IA pour nettoyer les transcriptions d'inspection immobilière
// Supprime le texte inutile et applique les corrections dictées
// Auteur : Cascade
// Date : 31/10/2025

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { text, model = 'gemini-1.5-pro' } = await request.json();

    if (!text) {
      return NextResponse.json({ success: false, error: 'Le texte est manquant.' }, { status: 400 });
    }

    // --- Implémentation de l'agent de nettoyage ---

    // Récupérer la clé d'API Gemini
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'La clé API Gemini est manquante.' }, { status: 500 });
    }

    // Prompt pour l'agent de nettoyage
    const prompt = `
      Tu es un agent IA spécialisé dans le nettoyage de transcriptions d'inspection immobilière.

      Ta mission est de nettoyer le texte transcrit pour ne garder que les informations pertinentes sur le bien immobilier inspecté.

      RÈGLES DE NETTOYAGE :

      1. SUPPRIMER tout texte parasite :
         - Salutations : "Bonjour monsieur", "Au revoir", "Merci", etc.
         - Commentaires personnels : "Il fait chaud ici", "Je suis fatigué", etc.
         - Questions/réponses hors sujet
         - Répétitions inutiles
         - Bruits parasites : "hum", "euh", "bon", etc.

      2. APPLIQUER LES CORRECTIONS :
         - Si l'utilisateur dit "Ah non, pardon, c'est du parquet" après avoir dit "carrelage", garder UNIQUEMENT "parquet"
         - Les corrections sont prioritaires sur les informations précédentes
         - Interpréter les auto-corrections naturelles

      3. STRUCTURER LE TEXTE NETTOYÉ :
         - TRAITER TOUT LE TEXTE SANS EXCEPTION - aucune partie ne doit être omise ou perdue
         - Grouper par pièce : commencer chaque pièce par son nom
         - Décrire les éléments dans l'ordre logique : sol, murs, plafond, fenêtres, portes
         - Pour chaque élément : mentionner substrat et revêtement quand disponibles
         - Maintenir une description claire et concise
         - AJOUTER UN SAUT DE LIGNE DOUBLE (\\n\\n) après chaque pièce pour les séparer clairement
         - UTILISER des marqueurs visuels comme "---" ou "===" entre les pièces si nécessaire

      4. FORMAT DE SORTIE :
         - Texte continu, pas de listes à puces
         - Descriptions naturelles et fluides
         - Pas de métadonnées ou commentaires sur le nettoyage
         - CONSERVATION INTÉGRALE de toutes les informations présentes dans le texte original
         - TRAITEMENT COMPLET : analyser et inclure TOUTES les parties du texte source

      5. toutes les pièces (Séjour,cuisine, chambre, salle de bain, etc.) situées dans le texte doivent être pris en compte tu dois les garder dans le texte nettoyé sauf si l'opérateur elle dit de la retirer
      6. Si l'opérateur dit que c'est la même chose tu dois reprendre les informations soit de la pièce précédente soit de la pièce qui l'a citée par exemple même chose que la cuisine tu dois récupérer les mêmes données que la cuisine pour la pièce en question
      7. conserve l'étage, ecrit le en chiffre numerique pas en lettre exemple "1er étage,2ème étage..." et pas "premier étage,deuxième étage..." dans le texte nettoyé
      8. dans le texte nettoyé tu dois mettre le batiment dans le texte nettoyé

      Voici le texte à nettoyer :
      --- TEXTE ORIGINAL ---
      ${text}
      --- FIN DU TEXTE ---

      Produis UNIQUEMENT le texte nettoyé, rien d'autre.
    `;

    // Utiliser Gemini avec le modèle spécifié
    console.log(`Utilisation de Gemini avec le modèle: ${model}`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const cleanedText = response.text().trim();
    console.log('✅ Gemini a répondu avec succès');

    return NextResponse.json({ success: true, cleanedText });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error("Erreur lors du nettoyage de la transcription:", errorMessage);
    return NextResponse.json({ success: false, error: "Erreur interne du serveur." }, { status: 500 });
  }
}
