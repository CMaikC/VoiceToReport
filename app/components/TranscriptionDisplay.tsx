// app/components/TranscriptionDisplay.tsx
// Note : Composant pour afficher et gérer l'affichage d'une transcription
// Auteur : Cascade
// Date : 23/10/2025

"use client";

import { Button } from "@/app/components/ui/button";
import { MoreHorizontal, Pencil, BrainCircuit } from 'lucide-react';

interface TranscriptionDisplayProps {
  transcription: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onSendToInspection: () => void;
}

export function TranscriptionDisplay({
  transcription,
  isExpanded,
  onToggleExpand,
  onEdit,
  onSendToInspection,
}: TranscriptionDisplayProps) {
  const isLongText = transcription.length > 200 || transcription.split('\n').length > 3;

  return (
    <div className="mt-3 p-3 border bg-amber-50/50 dark:bg-amber-900/20 rounded-lg text-sm">
      <p className={`whitespace-pre-wrap leading-relaxed ${!isExpanded && isLongText ? 'line-clamp-3' : ''}`}>
        {transcription}
      </p>
      <div className="flex justify-end items-center mt-2 relative">
        <div className="absolute left-1/2 -translate-x-1/2">
          {isLongText && (
            <Button
              variant="outline"
              className="h-auto p-1"
              onClick={onToggleExpand}
            >
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" /> Modifier
          </Button>
          <Button variant="ghost" size="sm" onClick={onSendToInspection}>
            <BrainCircuit className="h-4 w-4 mr-1" />
            Traiter avec IA
          </Button>
        </div>
      </div>
    </div>
  );
}
