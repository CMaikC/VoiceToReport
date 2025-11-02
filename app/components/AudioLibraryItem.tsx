// app/components/AudioLibraryItem.tsx
// Note : Composant pour afficher un élément de la bibliothèque audio avec ses enfants
// Auteur : Cascade
// Date : 23/10/2025

"use client";

import { useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { Input } from "@/app/components/ui/input";
import { Loader2, FileText, Download, Trash2, Plus, Edit3, Check, X } from 'lucide-react';
import { AudioPlayer } from '@/app/components/AudioPlayer';
import { TranscriptionDisplay } from '@/app/components/TranscriptionDisplay';

interface AudioFile {
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

interface AudioLibraryItemProps {
  audio: AudioFile;
  transcribingFileIds: Set<number>;
  transcriptionProgress: Map<number, number>;
  isTranscriptionExpanded: boolean;
  onAddSegment: (parentId: number) => void;
  onTranscribe: (file: AudioFile, groupId: number) => void;
  onDownload: (audio: AudioFile) => void;
  onDelete: (fileName: string) => void;
  onToggleTranscriptionExpand: (audioId: number) => void;
  onEditTranscription: (audio: AudioFile) => void;
  onSendToInspection: (transcription: string) => void;
  onUpdateMissionName: (audioId: number, newMissionName: string) => void;
}

// Fonction utilitaire pour formater les octets
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function AudioLibraryItem({
  audio,
  transcribingFileIds,
  transcriptionProgress,
  isTranscriptionExpanded,
  onAddSegment,
  onTranscribe,
  onDownload,
  onDelete,
  onToggleTranscriptionExpand,
  onEditTranscription,
  onSendToInspection,
  onUpdateMissionName,
}: AudioLibraryItemProps) {
  const [isEditingMissionName, setIsEditingMissionName] = useState(false);
  const [editingMissionName, setEditingMissionName] = useState(audio.mission_name || '');
  const [editingChildId, setEditingChildId] = useState<number | null>(null);
  const [editingChildName, setEditingChildName] = useState('');
  const isParentTranscribing = transcribingFileIds.has(audio.id);
  const parentProgress = transcriptionProgress.get(audio.id) || 0;
  return (
    <li className="group flex flex-col p-2 border-2 border-border/60 rounded-lg bg-card">
      {/* Ligne principale du parent */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 mr-2">
          {/* Nom de la mission comme titre principal */}
          {audio.mission_name ? (
            <div className="flex items-center gap-2 mb-1">
              {isEditingMissionName ? (
                <>
                  <Input
                    value={editingMissionName}
                    onChange={(e) => setEditingMissionName(e.target.value)}
                    className="text-lg font-bold flex-1 border-2 border-primary"
                    placeholder="Nom de la mission..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        console.log('⌨️ Touche Entrée pressée pour mission, valeur:', editingMissionName.trim());
                        onUpdateMissionName(audio.id, editingMissionName.trim());
                        setIsEditingMissionName(false);
                      } else if (e.key === 'Escape') {
                        console.log('⌨️ Touche Échap pressée pour mission');
                        setEditingMissionName(audio.mission_name || '');
                        setIsEditingMissionName(false);
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      console.log('✅ Bouton V cliqué pour mission, valeur:', editingMissionName.trim());
                      onUpdateMissionName(audio.id, editingMissionName.trim());
                      setIsEditingMissionName(false);
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setEditingMissionName(audio.mission_name || '');
                      setIsEditingMissionName(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-primary flex-1" title={audio.mission_name}>
                    {audio.mission_name}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditingMissionName(true)}
                    title="Modifier le nom de la mission"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-sm px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsEditingMissionName(true)}
                title="Ajouter un nom de mission"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Ajouter nom de mission
              </Button>
            </div>
          )}
          
          {/* Nom du fichier comme sous-titre */}
          <p className="text-sm text-muted-foreground truncate" title={audio.name}>
            Fichier: {audio.name}
          </p>
          
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(audio.created_at).toLocaleString('fr-FR')}
            {audio.size_bytes != null && ` • ${formatBytes(audio.size_bytes)}`}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="outline" 
            size="sm" 
            title="Ajouter un segment" 
            onClick={() => onAddSegment(audio.id)} 
            className="h-8 px-2"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            title="Transcrire" 
            onClick={() => onTranscribe(audio, audio.id)} 
            disabled={isParentTranscribing || audio.is_transcribed} 
            className="h-8 px-2"
          >
            {isParentTranscribing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-1" />
            )}
            Transcrire
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Télécharger" 
            onClick={() => onDownload(audio)} 
            className="h-8 px-2"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Supprimer le groupe" 
            onClick={() => onDelete(audio.name)} 
            className="h-8 px-2 text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Barre de progression pour le fichier parent */}
      {isParentTranscribing && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Transcription en cours...</span>
            <span className="font-medium">{parentProgress}%</span>
          </div>
          <Progress value={parentProgress} className="h-2" />
        </div>
      )}

      {/* Lecteur audio */}
      <div className="mt-2">
        <AudioPlayer src={audio.url} />
      </div>

      {/* Affichage des enfants */}
      {audio.children && audio.children.length > 0 && (
        <div className="ml-4 mt-2 pl-4 border-l-2 space-y-3">
          {audio.children.map(child => {
            const isChildTranscribing = transcribingFileIds.has(child.id);
            const childProgress = transcriptionProgress.get(child.id) || 0;
            return (
            <div key={child.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-2">
                  {/* Nom du segment comme titre secondaire */}
                  {editingChildId === child.id ? (
                    <div className="flex items-center gap-1 mb-1">
                      <Input
                        value={editingChildName}
                        onChange={(e) => setEditingChildName(e.target.value)}
                        className="text-sm h-6 flex-1"
                        placeholder="Nom du segment..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            console.log('⌨️ Touche Entrée pressée pour segment, valeur:', editingChildName.trim());
                            onUpdateMissionName(child.id, editingChildName.trim());
                            setEditingChildId(null);
                          } else if (e.key === 'Escape') {
                            console.log('⌨️ Touche Échap pressée pour segment');
                            setEditingChildId(null);
                            setEditingChildName('');
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          console.log('✅ Bouton V cliqué pour segment, valeur:', editingChildName.trim());
                          onUpdateMissionName(child.id, editingChildName.trim());
                          setEditingChildId(null);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setEditingChildId(null);
                          setEditingChildName('');
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mb-0.5">
                      {child.mission_name ? (
                        <>
                          <p className="text-sm font-semibold text-secondary-foreground" title={child.mission_name}>
                            {child.mission_name}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setEditingChildId(child.id);
                              setEditingChildName(child.mission_name || '');
                            }}
                            title="Modifier le nom du segment"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 text-xs px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setEditingChildId(child.id);
                            setEditingChildName(child.mission_name || '');
                          }}
                          title="Ajouter un nom de segment"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Nom
                        </Button>
                      )}
                    </div>
                  )}
                  <p className="text-xs truncate font-mono text-muted-foreground" title={child.name}>
                    {child.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(child.created_at).toLocaleString('fr-FR')}
                    {child.size_bytes != null && ` • ${formatBytes(child.size_bytes)}`}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  title="Transcrire" 
                  onClick={() => onTranscribe(child, audio.id)} 
                  disabled={isChildTranscribing || child.is_transcribed} 
                  className="h-8 px-2"
                >
                  {isChildTranscribing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-1" />
                  )}
                  Transcrire
                </Button>
              </div>
              <div className="mt-1">
                <AudioPlayer src={child.url} />
              </div>
              {/* Barre de progression pour l'enfant */}
              {isChildTranscribing && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Transcription en cours...</span>
                    <span className="font-medium">{childProgress}%</span>
                  </div>
                  <Progress value={childProgress} className="h-2" />
                </div>
              )}
            </div>
          )})}
        </div>
      )}

      {/* Affichage de la transcription COMMUNE */}
      {audio.transcription && (
        <TranscriptionDisplay
          transcription={audio.transcription}
          isExpanded={isTranscriptionExpanded}
          onToggleExpand={() => onToggleTranscriptionExpand(audio.id)}
          onEdit={() => onEditTranscription(audio)}
          onSendToInspection={() => onSendToInspection(audio.transcription || '')}
        />
      )}
    </li>
  );
}

