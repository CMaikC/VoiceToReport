// app/components/EditTranscriptionModal.tsx
// Note : Fenêtre modale pour éditer la transcription d'un segment audio.
// Auteur : Cascade
// Date : 22/10/2025

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';

interface EditTranscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcription: string;
  onSave: (newTranscription: string) => void;
}

export function EditTranscriptionModal({ isOpen, onClose, transcription, onSave }: EditTranscriptionModalProps) {
  const [editedTranscription, setEditedTranscription] = useState(transcription);

  useEffect(() => {
    setEditedTranscription(transcription);
  }, [transcription, isOpen]);

  const handleSave = () => {
    onSave(editedTranscription);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="custom-modal-bg sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modifier la transcription</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={editedTranscription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedTranscription(e.target.value)}
            className="min-h-[200px] text-base"
            placeholder="Écrivez la transcription ici..."
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
