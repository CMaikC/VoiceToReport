// app/components/InspectionProcessor.tsx
// Note : Composant pour traiter les transcriptions d'inspection et générer les fichiers Excel
// Utilise les deux agents IA pour nettoyer et structurer les données
// Auteur : Cascade
// Date : 31/10/2025

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Progress } from "@/app/components/ui/progress";
import { AlertCircle, FileText, Download, Loader2, CheckCircle, Brain } from 'lucide-react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

interface InspectionProcessorProps {
  initialTranscription?: string;
}

export function InspectionProcessor({ initialTranscription = '' }: InspectionProcessorProps) {
  const [rawTranscription, setRawTranscription] = useState('');
  const [cleanedText, setCleanedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { name: 'Nettoyage du texte', status: 'pending' },
    { name: 'Structuration des données', status: 'pending' },
    { name: 'Génération des fichiers Excel', status: 'pending' }
  ]);
  const [excelFiles, setExcelFiles] = useState<{rooms: {data: string, filename: string}, descriptions: {data: string, filename: string}} | null>(null);
  const [structuredData, setStructuredData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Liste des modèles Gemini 2.5 disponibles selon documentation officielle (https://ai.google.dev/gemini-api/docs/models)
  const availableModels = [
    { value: 'simulation', label: 'Simulation (Rapide & Fiable)', description: 'Traitement local ultra-rapide' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Modèle de pointe avec reasoning complexe (1M tokens)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Modèle équilibré haute performance (1M tokens)' },
    { value: 'gemini-2.5-flash-preview-09-2025', label: 'Gemini 2.5 Flash Preview', description: 'Version preview optimisée (Sept 2025)' },
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', description: 'Version ultra-rapide optimisée coût (1M tokens)' },
    { value: 'gemini-2.5-flash-lite-preview-09-2025', label: 'Gemini 2.5 Flash-Lite Preview', description: 'Version preview ultra-rapide (Sept 2025)' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Modèle de seconde génération (1M tokens)' },
    { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite', description: 'Version légère seconde génération' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Modèle avancé première génération' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Modèle rapide première génération' }
  ];

  // État pour le modèle sélectionné
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash-lite');

  // Mettre à jour la transcription quand elle est passée en prop
  useEffect(() => {
    if (initialTranscription) {
      setRawTranscription(initialTranscription);
    }
  }, [initialTranscription]);

  // Gestionnaire de changement de modèle
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = event.target.value;
    console.log('Changement de modèle:', selectedModel, '→', newModel);
    setSelectedModel(newModel);
  };

  // Logger les changements de modèle
  useEffect(() => {
    console.log('🔄 Modèle IA changé:', selectedModel);
  }, [selectedModel]);

  const updateStepStatus = (stepIndex: number, status: ProcessingStep['status'], message?: string) => {
    setProcessingSteps(prev => prev.map((step, index) =>
      index === stepIndex ? { ...step, status, message } : step
    ));
  };

  const processTranscription = async () => {
    if (!rawTranscription.trim()) {
      setError('Veuillez saisir une transcription.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setCleanedText('');
    setExcelFiles(null);

    console.log('🎯 Démarrage du traitement avec le modèle:', selectedModel);

    try {
      // Étape 1 : Nettoyer le texte
      updateStepStatus(0, 'processing');
      const cleanResponse = await fetch('/api/clean-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawTranscription, model: selectedModel }),
      });

      const cleanData = await cleanResponse.json();
      if (!cleanData.success) {
        throw new Error(cleanData.error || 'Erreur lors du nettoyage du texte.');
      }

      setCleanedText(cleanData.cleanedText);
      updateStepStatus(0, 'completed');

      // Étape 2 : Structurer les données
      updateStepStatus(1, 'processing');
      const structureResponse = await fetch('/api/structure-inspection-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanedText: cleanData.cleanedText, model: selectedModel }),
      });

      const structureData = await structureResponse.json();
      if (!structureData.success) {
        throw new Error(structureData.error || 'Erreur lors de la structuration des données.');
      }

      updateStepStatus(1, 'completed');

      // Stocker les données structurées pour l'affichage
      setStructuredData(structureData.structuredData);

      // Étape 3 : Générer les fichiers Excel
      updateStepStatus(2, 'processing');
      const excelResponse = await fetch('/api/generate-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structuredData: structureData.structuredData }),
      });

      const excelData = await excelResponse.json();
      if (!excelData.success) {
        throw new Error(excelData.error || 'Erreur lors de la génération des fichiers Excel.');
      }

      setExcelFiles(excelData.files);
      updateStepStatus(2, 'completed');

    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue s\'est produite.';
      setError(errorMessage);

      // Marquer l'étape en cours comme échouée
      const currentStepIndex = processingSteps.findIndex(step => step.status === 'processing');
      if (currentStepIndex !== -1) {
        updateStepStatus(currentStepIndex, 'error', errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (base64Data: string, filename: string) => {
    try {
      // Convertir base64 en Uint8Array
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Créer le blob
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);

      // Télécharger le fichier
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Nettoyer l'URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  const resetProcessing = () => {
    setProcessingSteps([
      { name: 'Nettoyage du texte', status: 'pending' },
      { name: 'Structuration des données', status: 'pending' },
      { name: 'Génération des fichiers Excel', status: 'pending' }
    ]);
    setCleanedText('');
    setStructuredData(null);
    setExcelFiles(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <FileText className="mr-2" /> Traitement d'Inspection Immobilière
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Zone de saisie de la transcription */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Transcription brute à traiter
            </label>
            <Textarea
              placeholder="Collez ici votre transcription d'inspection immobilière..."
              value={rawTranscription}
              onChange={(e) => setRawTranscription(e.target.value)}
              className="min-h-32"
              disabled={isProcessing}
            />
          </div>

          {/* Sélection du modèle IA */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center">
              <Brain className="mr-2 h-4 w-4" />
              Modèle IA à utiliser
            </label>
            <select
              value={selectedModel}
              onChange={handleModelChange}
              disabled={isProcessing}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {availableModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label} - {model.description}
                </option>
              ))}
            </select>
            <div className="text-xs text-muted-foreground">
              Modèle sélectionné: <span className="font-medium">{availableModels.find(m => m.value === selectedModel)?.label || selectedModel}</span>
            </div>
            {selectedModel !== 'simulation' && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                Les modèles Gemini peuvent être indisponibles actuellement
              </p>
            )}
          </div>

          {/* Bouton de traitement */}
          <div className="flex gap-3">
            <Button
              onClick={processTranscription}
              disabled={isProcessing || !rawTranscription.trim()}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                'Traiter la transcription'
              )}
            </Button>
            {(cleanedText || excelFiles) && (
              <Button
                variant="outline"
                onClick={resetProcessing}
                disabled={isProcessing}
              >
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Indicateur de progression */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center text-sm font-medium">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement en cours...
              </div>
              <div className="space-y-2">
                {processingSteps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {step.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                    {step.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {step.status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
                    <span className={`text-sm ${step.status === 'processing' ? 'font-medium' : ''}`}>
                      {step.name}
                    </span>
                    {step.message && (
                      <span className="text-xs text-red-500">{step.message}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affichage du texte nettoyé */}
          {cleanedText && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Texte nettoyé
              </label>
              <div className="p-3 border rounded-lg bg-amber-50/50 dark:bg-amber-900/20">
                <p className="text-sm whitespace-pre-wrap">{cleanedText}</p>
              </div>
            </div>
          )}

          {/* Affichage des données structurées en deux colonnes */}
          {structuredData && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Données structurées pour les fichiers Excel
              </label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Colonne 1: Liste des pièces */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    📋 Liste des pièces (Excel 1)
                  </h4>
                  <div className="p-3 border rounded-lg bg-blue-50/50 dark:bg-blue-900/20 max-h-64 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {(() => {
                        // Générer les données pour le premier fichier Excel (liste des pièces)
                        const roomsData = [];

                        // Ajouter l'en-tête
                        roomsData.push({
                          id_classement_champs: 'id_classement_champs',
                          Lot: 'Lot',
                          PieceHorsCREP: 'PieceHorsCREP',
                          PieceExterieure: 'PieceExterieure',
                          ClefComposant: 'ClefComposant',
                          Batiment: 'Batiment',
                          Local: 'Local',
                          Justification: 'Justification',
                          MoyenAMettreEnOeuvre: 'MoyenAMettreEnOeuvre'
                        });

                        let index = 0;

                        if (structuredData.rooms) {
                          structuredData.rooms.forEach((room: any) => {
                            roomsData.push({
                              id_classement_champs: String(index).padStart(5, '0'),
                              Lot: '',
                              PieceHorsCREP: '',
                              PieceExterieure: '',
                              ClefComposant: `clé_${index + 1}`,
                              Batiment: room.floor || structuredData.floor || 'Bâtiment',
                              Local: room.name,
                              Justification: '',
                              MoyenAMettreEnOeuvre: ''
                            });
                            index++;
                          });
                        }

                        return JSON.stringify(roomsData, null, 2);
                      })()}
                    </pre>
                  </div>
                </div>

                {/* Colonne 2: Description des pièces */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-green-600 dark:text-green-400">
                    🏗️ Description des pièces (Excel 2)
                  </h4>
                  <div className="p-3 border rounded-lg bg-green-50/50 dark:bg-green-900/20 max-h-64 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {(() => {
                        // Générer les données pour le deuxième fichier Excel
                        const descriptionsData = [];

                        // Ajouter l'en-tête
                        descriptionsData.push({
                          id_classement_champs: 'id_classement_champs',
                          ClefComposant: 'ClefComposant',
                          Localisation: 'Localisation',
                          Informations: 'Informations',
                          Type: 'Type',
                          CREP_degradation: 'CREP_degradation',
                          CREP_degradation_Details: 'CREP_degradation_Details',
                          CREP_mesure: 'CREP_mesure',
                          Data_1: 'Data_1',
                          Data_2: 'Data_2',
                          Data_3: 'Data_3',
                          Data_4: 'Data_4'
                        });

                        let elementIndex = 0;

                        if (structuredData.rooms) {
                          structuredData.rooms.forEach((room: any) => {
                            room.elements.forEach((element: any) => {
                              const informations = `Substrat : ${element.substrat}${element.revetement ? ` - Revêtement : ${element.revetement}` : ''}`;
                              const location = `${room.floor || structuredData.floor || 'Bâtiment'} - ${room.name}`;

                              descriptionsData.push({
                                id_classement_champs: '',
                                ClefComposant: `clé_${elementIndex++}`,
                                Localisation: location,
                                Informations: informations,
                                Type: element.type,
                                CREP_degradation: '',
                                CREP_degradation_Details: '',
                                CREP_mesure: '',
                                Data_1: '',
                                Data_2: '',
                                Data_3: '',
                                Data_4: ''
                              });
                            });
                          });
                        }

                        return JSON.stringify(descriptionsData, null, 2);
                      })()}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Téléchargement des fichiers Excel */}
          {excelFiles && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Fichiers Excel générés
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => downloadFile(excelFiles.rooms.data, excelFiles.rooms.filename)}
                  className="flex items-center justify-start"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {excelFiles.rooms.filename}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadFile(excelFiles.descriptions.data, excelFiles.descriptions.filename)}
                  className="flex items-center justify-start"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {excelFiles.descriptions.filename}
                </Button>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
