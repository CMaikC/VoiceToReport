// app/components/WhisperModeSwitch.tsx
// Note : Composant pour basculer entre le mode Whisper local et en ligne
// Auteur : Cascade
// Date : 23/10/2025

"use client";

import { useState, useEffect } from 'react';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Cloud, Server, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';

export function WhisperModeSwitch() {
  // État pour gérer le mode (true = local, false = online)
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [isServerHealthy, setIsServerHealthy] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Charger le mode depuis localStorage au démarrage
  useEffect(() => {
    const savedMode = localStorage.getItem('whisperMode');
    if (savedMode) {
      setIsLocalMode(savedMode === 'local');
    } else {
      // Par défaut, utiliser la valeur de l'environnement
      const envMode = process.env.NEXT_PUBLIC_WHISPER_MODE || 'online';
      setIsLocalMode(envMode === 'local');
    }
  }, []);

  // Vérifier la santé du serveur local quand on passe en mode local
  useEffect(() => {
    if (isLocalMode) {
      checkServerHealth();
    }
  }, [isLocalMode]);

  // Fonction pour vérifier si le serveur local est accessible
  const checkServerHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // Timeout de 3 secondes
      });
      setIsServerHealthy(response.ok);
    } catch (error) {
      setIsServerHealthy(false);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Gérer le changement de mode
  const handleModeChange = (checked: boolean) => {
    const newMode = checked ? 'local' : 'online';
    setIsLocalMode(checked);
    localStorage.setItem('whisperMode', newMode);
    
    // Vérifier la santé du serveur si on passe en mode local
    if (checked) {
      checkServerHealth();
    }
  };

  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3">
            {isLocalMode ? (
              <Server className="h-5 w-5 text-blue-500" />
            ) : (
              <Cloud className="h-5 w-5 text-purple-500" />
            )}
            <div className="space-y-0.5">
              <Label htmlFor="whisper-mode" className="text-sm font-medium cursor-pointer">
                Mode Whisper
              </Label>
              <p className="text-xs text-muted-foreground">
                {isLocalMode ? 'Serveur local (FastAPI)' : 'API en ligne (OpenAI)'}
              </p>
            </div>
          </div>
          <Switch
            id="whisper-mode"
            checked={isLocalMode}
            onCheckedChange={handleModeChange}
          />
        </div>
        
        {/* Afficher un avertissement si le serveur local n'est pas accessible */}
        {isLocalMode && !isCheckingHealth && !isServerHealthy && (
          <div className="mt-3 flex items-start space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-800 dark:text-yellow-200">
              <p className="font-medium">Serveur local non accessible</p>
              <p className="mt-1">
                Assurez-vous que le serveur FastAPI est lancé sur le port 8000.
              </p>
            </div>
          </div>
        )}
        
        {/* Afficher un message de succès si le serveur est accessible */}
        {isLocalMode && isServerHealthy && (
          <div className="mt-3 flex items-start space-x-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
            <p className="text-xs text-green-800 dark:text-green-200">
              Serveur local connecté
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
