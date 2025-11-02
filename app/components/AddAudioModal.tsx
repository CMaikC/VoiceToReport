// app/components/AddAudioModal.tsx
// Note : Fenêtre modale pour ajouter un nouvel enregistrement audio.
// Auteur : Cascade
// Date : 22/10/2025

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Mic, Upload } from 'lucide-react';
import MicRecorder from 'mic-recorder-to-mp3';

interface AddAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileAdd: (file: File, segmentName: string) => void;
  parentId: number;
}

export function AddAudioModal({ isOpen, onClose, onFileAdd, parentId }: AddAudioModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const recorderRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      recorderRef.current = new MicRecorder({ bitRate: 128 });
      
      // Générer automatiquement un nom de segment par défaut
      const generateDefaultName = async () => {
        try {
          const response = await fetch('/api/files');
          const data = await response.json();
          if (data.success) {
            // Trouver le parent et compter ses enfants
            const parent = data.files.find((file: any) => file.id === parentId);
            if (parent && parent.children) {
              const nextNumber = parent.children.length + 1;
              const defaultName = `sans titre ${nextNumber.toString().padStart(2, '0')}`;
              setSegmentName(defaultName);
            } else {
              setSegmentName('sans titre 01');
            }
          }
        } catch (error) {
          console.error('Erreur lors de la génération du nom par défaut:', error);
          setSegmentName('sans titre 01');
        }
      };
      
      generateDefaultName();
    }
  }, [isOpen, parentId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileAdd(file, segmentName);
      onClose();
    }
  };

  const startRecording = () => {
    recorderRef.current?.start().then(() => setIsRecording(true));
  };

  const stopRecording = () => {
    recorderRef.current?.stop().getMp3().then(([buffer, blob]: [any, Blob]) => {
      const fileName = `segment-${new Date().toISOString().replace(/:/g, '-')}.mp3`;
      const newAudioFile = new File([blob], fileName, { type: 'audio/mp3' });
      onFileAdd(newAudioFile, segmentName);
      setIsRecording(false);
      onClose();
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="custom-modal-bg">
        <DialogHeader>
          <DialogTitle>Ajouter un segment audio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Nom du segment */}
          <div className="space-y-2">
            <label htmlFor="segment-name" className="text-sm font-medium">
              Nom du segment
            </label>
            <Input
              id="segment-name"
              type="text"
              placeholder="Entrez le nom du segment..."
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Zone d'upload */}
          <div className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent">
            <div className="absolute text-center pointer-events-none">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Glissez-déposez ou cliquez</p>
            </div>
            <Input type="file" accept="audio/*" onChange={handleFileChange} className="h-full w-full opacity-0 cursor-pointer" />
          </div>
          {/* Zone d'enregistrement */}
          <div className="flex flex-col items-center">
            <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? 'destructive' : 'default'}>
              <Mic className="mr-2 h-4 w-4" />
              {isRecording ? 'Arrêter' : 'Enregistrer'}
            </Button>
            {isRecording && <p className="text-sm mt-2 text-destructive">Enregistrement en cours...</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
