// app/components/FileUploadSection.tsx
// Note : Composant pour la section d'upload et d'enregistrement de fichiers audio
// Auteur : Cascade
// Date : 23/10/2025

"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Mic, Upload } from 'lucide-react';
import { WhisperModeSwitch } from '@/app/components/WhisperModeSwitch';

interface FileUploadSectionProps {
  isRecording: boolean;
  isDragging: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>, missionName: string) => void;
  onStartRecording: () => void;
  onStopRecording: (missionName: string) => void;
  onDrag: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
}

export function FileUploadSection({
  isRecording,
  isDragging,
  onFileChange,
  onStartRecording,
  onStopRecording,
  onDrag,
  onDrop,
}: FileUploadSectionProps) {
  const [missionName, setMissionName] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFileChange(event, missionName);
  };

  const handleDrop = (event: React.DragEvent) => {
    // Simuler un événement de changement de fichier pour réutiliser la logique
    const file = event.dataTransfer.files?.[0];
    if (file) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const fakeEvent = { target: { files: dataTransfer.files } };
      onFileChange(fakeEvent as any, missionName);
    }
  };
  return (
    <div className="space-y-6">
      {/* Composant de bascule entre mode local et en ligne */}
      <WhisperModeSwitch />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Upload className="mr-2" /> Importer ou Enregistrer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nom de la mission */}
          <div className="space-y-2">
            <label htmlFor="mission-name" className="text-sm font-medium">
              Nom de la mission (optionnel)
            </label>
            <Input
              id="mission-name"
              type="text"
              placeholder="Entrez le nom de la mission..."
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Section de téléversement */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center">
              <Upload className="mr-2 h-4 w-4" /> Téléverser un fichier
            </h3>
            <div 
              onDragEnter={onDrag}
              onDragLeave={onDrag}
              onDragOver={onDrag}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'bg-accent border-primary' : 'bg-card hover:bg-accent'}`}
            >
              <div className="absolute text-center pointer-events-none">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Glissez-déposez</span> ou cliquez
                </p>
                <p className="text-xs text-muted-foreground">Fichiers audio</p>
              </div>
              <Input 
                id="audio-upload" 
                type="file" 
                accept="audio/*" 
                onChange={handleFileChange} 
                className="h-full w-full opacity-0 cursor-pointer" 
              />
            </div>
          </div>

          {/* Séparateur */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Section d'enregistrement */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center">
              <Mic className="mr-2 h-4 w-4" /> Enregistrer
            </h3>
            <div className="flex flex-col items-center justify-center space-y-4 p-6 border rounded-lg bg-card">
              {isRecording && (
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <p className="text-red-500 font-medium">Enregistrement...</p>
                </div>
              )}
              <Button 
                onClick={isRecording ? () => onStopRecording(missionName) : onStartRecording} 
                variant={isRecording ? 'destructive' : 'default'}
                size="lg"
                className="w-full max-w-xs"
              >
                <Mic className="mr-2 h-5 w-5" />
                {isRecording ? 'Arrêter' : 'Démarrer'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
