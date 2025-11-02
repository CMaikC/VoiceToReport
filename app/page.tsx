"use client";

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Moon, Sun, Library, FileText } from 'lucide-react';
import { SkeletonCard } from '@/app/components/SkeletonCard';
import { AddAudioModal } from '@/app/components/AddAudioModal';
import { EditTranscriptionModal } from '@/app/components/EditTranscriptionModal';
import { AppLayout } from '@/app/components/layout/AppLayout';
import { FileUploadSection } from '@/app/components/FileUploadSection';
import { AudioLibraryItem } from '@/app/components/AudioLibraryItem';
import { InspectionProcessor } from '@/app/components/InspectionProcessor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import MicRecorder from 'mic-recorder-to-mp3';

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


export default function Home() {
  const { setTheme } = useTheme();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const recorderRef = useRef<any | null>(null); // Référence à l'enregistreur audio MicRecorder
  const [expandedTranscriptionIds, setExpandedTranscriptionIds] = useState<Set<number>>(new Set());
  const [audioLibrary, setAudioLibrary] = useState<AudioFile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingAudio, setCurrentEditingAudio] = useState<AudioFile | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [transcribingFileIds, setTranscribingFileIds] = useState<Set<number>>(new Set());
  const [transcriptionProgress, setTranscriptionProgress] = useState<Map<number, number>>(new Map());
  const [activeTab, setActiveTab] = useState<string>("library");
  const [inspectionTranscription, setInspectionTranscription] = useState<string>("");

  // Charger la bibliothèque audio au démarrage
  useEffect(() => {
    const fetchAudioLibrary = async () => {
      try {
        const response = await fetch('/api/files');
        const data = await response.json();
        if (data.success) {
          setAudioLibrary(data.files);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la bibliothèque audio:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchAudioLibrary();
  }, []);

  // Initialiser l'enregistreur une seule fois
  useEffect(() => {
    const newRecorder = new MicRecorder({ bitRate: 128 });
    recorderRef.current = newRecorder;
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, missionName: string) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      if (missionName.trim()) {
        formData.append('missionName', missionName.trim());
      }
      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) {
          // Mettre à jour la liste des fichiers avec les données de la DB
          setAudioLibrary(prev => [data.file, ...prev]);
        }
      } catch (error) {
        console.error("Erreur lors de l'upload du fichier:", error);
      }
    }
  };

  const startRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.start().then(() => {
        setIsRecording(true);
      }).catch((e: any) => console.error(e));
    }
  };

  const stopRecording = (missionName: string) => {
    if (recorderRef.current) {
      recorderRef.current.stop().getMp3().then(async ([buffer, blob]: [any, Blob]) => {
        const fileName = `enregistrement-${new Date().toISOString().replace(/:/g, '-')}.mp3`;
        const newAudioFile = new File([blob], fileName, { type: 'audio/mp3' });

        // Envoyer le fichier au serveur
        const formData = new FormData();
        formData.append('file', newAudioFile);
        if (missionName.trim()) {
          formData.append('missionName', missionName.trim());
        }
        try {
          const response = await fetch('/api/upload', { method: 'POST', body: formData });
          const data = await response.json();
          if (data.success) {
            setAudioLibrary(prev => [data.file, ...prev]);
          }
        } catch (error) {
          console.error("Erreur lors de l'upload de l'enregistrement:", error);
        }

        setIsRecording(false);
      }).catch((e: any) => console.error(e));
    }
  };

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setIsDragging(true);
    } else if (event.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      // Simuler un événement de changement de fichier pour réutiliser la logique
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const fakeEvent = { target: { files: dataTransfer.files } };
      handleFileChange(fakeEvent as any, '');
    }
  };

  const handleDownloadAudio = (audio: AudioFile) => {
    const a = document.createElement('a');
    a.href = audio.url;
    a.download = audio.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteAudio = async (fileName: string) => {
    try {
      const response = await fetch(`/api/files/${fileName}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        // Rafraîchir la page pour mettre à jour la bibliothèque et l'historique
        window.location.reload();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier:", error);
    }
  };

  const handleAddSegment = (parentId: number) => {
    setCurrentParentId(parentId);
    setIsModalOpen(true);
  };

  const handleFileAdd = async (file: File, segmentName: string) => {
    if (!currentParentId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('parentId', currentParentId.toString());
    if (segmentName.trim()) {
      formData.append('missionName', segmentName.trim());
    }

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) {
        // Recharger toute la bibliothèque pour refléter le nouvel ajout
        const freshData = await fetch('/api/files').then(res => res.json());
        if (freshData.success) {
          setAudioLibrary(freshData.files);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l-ajout du segment:', error);
    }
  };


  const handleOpenEditModal = (audio: AudioFile) => {
    setCurrentEditingAudio(audio);
    setIsEditModalOpen(true);
  };

  const handleSendToInspection = (transcription: string) => {
    setInspectionTranscription(transcription);
    setActiveTab("inspection");
  };

  const handleUpdateMissionName = async (audioId: number, newMissionName: string) => {
    console.log('🔄 handleUpdateMissionName appelé avec:', { audioId, newMissionName });
    try {
      // Trouver le fichier par ID pour obtenir son nom
      const audioFile = audioLibrary.find(audio => audio.id === audioId);
      if (!audioFile) {
        console.log('❌ Fichier non trouvé pour ID:', audioId);
        return;
      }
      console.log('📁 Fichier trouvé:', audioFile.name);

      const response = await fetch(`/api/files/${audioFile.name}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionName: newMissionName }),
      });

      console.log('📡 Réponse API:', response.status, response.ok);

      if (response.ok) {
        console.log('✅ API PATCH réussie, rechargement de la bibliothèque...');
        // Recharger la bibliothèque pour avoir les données à jour
        const freshData = await fetch('/api/files').then(res => res.json());
        if (freshData.success) {
          console.log('📚 Bibliothèque rechargée avec succès:', freshData.files.length, 'fichiers');
          setAudioLibrary(freshData.files);
        } else {
          console.log('❌ Échec du rechargement de la bibliothèque:', freshData);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur API PATCH:', response.status, errorText);
      }
    } catch (error) {
      console.error('💥 Erreur lors de la mise à jour du nom de mission:', error);
    }
  };

  const handleSaveTranscription = async (newTranscription: string) => {
    if (!currentEditingAudio || !currentEditingAudio.transcription_id) return;

    try {
      const response = await fetch(`/api/transcriptions/${currentEditingAudio.transcription_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: newTranscription }),
      });

      if (response.ok) {
        const freshData = await fetch('/api/files').then(res => res.json());
        if (freshData.success) {
          setAudioLibrary(freshData.files);
        }
        setIsEditModalOpen(false);
        setCurrentEditingAudio(null);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleTranscription = async (fileToTranscribe: AudioFile, groupId: number) => {
    const fileId = fileToTranscribe.id;
    
    // Marquer le fichier comme en cours de transcription
    setTranscribingFileIds(prev => new Set(prev).add(fileId));
    setTranscriptionProgress(prev => new Map(prev).set(fileId, 0));
    
    // Simuler une progression (car l'API ne retourne pas de progression en temps réel)
    const progressInterval = setInterval(() => {
      setTranscriptionProgress(prev => {
        const newMap = new Map(prev);
        const currentProgress = newMap.get(fileId) || 0;
        if (currentProgress < 90) {
          newMap.set(fileId, currentProgress + 10);
        }
        return newMap;
      });
    }, 500);
    
    const formData = new FormData();
    formData.append('audioFileId', fileToTranscribe.id.toString());
    formData.append('audioGroupId', groupId.toString());
    
    // Récupérer le mode Whisper depuis localStorage
    const whisperMode = localStorage.getItem('whisperMode') || 'online';
    formData.append('whisperMode', whisperMode);

    try {
      const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const result = await response.json();
      
      // Compléter la progression
      clearInterval(progressInterval);
      setTranscriptionProgress(prev => new Map(prev).set(fileId, 100));
      
      if (result.success) {
        // Attendre un peu pour montrer 100%
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Recharger toute la bibliothèque pour avoir les données à jour
        const freshData = await fetch('/api/files').then(res => res.json());
        if (freshData.success) {
          setAudioLibrary(freshData.files);
        }
      } else {
        // Afficher l'erreur à l'utilisateur
        alert(result.error || 'Erreur lors de la transcription');
      }
    } catch (error) {
      console.error('Erreur de transcription:', error);
      alert('Erreur lors de la transcription');
      clearInterval(progressInterval);
    } finally {
      // Nettoyer les états de progression
      setTranscribingFileIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
      setTranscriptionProgress(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });
    }
  };

  // Contenu de la sidebar avec le composant refactorisé
  const sidebarContent = (
    <FileUploadSection
      isRecording={isRecording}
      isDragging={isDragging}
      onFileChange={handleFileChange}
      onStartRecording={startRecording}
      onStopRecording={stopRecording}
      onDrag={handleDrag}
      onDrop={handleDrop}
    />
  );

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <header className="p-4 border-b flex justify-between items-center">
        <h1 className="text-2xl font-bold">VoiceToReport</h1>
        <div>
          <Button variant="outline" size="icon" onClick={() => setTheme('light')} className="dark:hidden">
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setTheme('dark')} className="hidden dark:inline-flex">
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </div>
      </header>
      <AppLayout sidebar={sidebarContent}>
        <AddAudioModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onFileAdd={handleFileAdd} 
          parentId={currentParentId!} 
        />
        {currentEditingAudio && (
          <EditTranscriptionModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setCurrentEditingAudio(null);
            }}
            transcription={currentEditingAudio.transcription || ''}
            onSave={handleSaveTranscription}
          />
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library" className="flex items-center">
              <Library className="mr-2 h-4 w-4" />
              Bibliothèque Audio
            </TabsTrigger>
            <TabsTrigger value="inspection" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Inspection Immobilière
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-6 h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center">
                    <Library className="mr-2" /> Bibliothèque
                  </span>
                  {audioLibrary.length > 0 && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {audioLibrary.length} fichier{audioLibrary.length > 1 ? 's' : ''}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 h-[calc(100vh-12rem)] overflow-y-auto">
                {isInitialLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                ) : audioLibrary.length === 0 ? (
                  <div className="text-center py-8">
                    <Library className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-xs text-muted-foreground">Aucun fichier audio</p>
                    <p className="text-xs text-muted-foreground mt-1">Vos fichiers apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {audioLibrary.map((audio) => (
                      <AudioLibraryItem
                        key={audio.id}
                        audio={audio}
                        transcribingFileIds={transcribingFileIds}
                        transcriptionProgress={transcriptionProgress}
                        isTranscriptionExpanded={expandedTranscriptionIds.has(audio.id)}
                        onAddSegment={handleAddSegment}
                        onTranscribe={handleTranscription}
                        onDownload={handleDownloadAudio}
                        onDelete={handleDeleteAudio}
                        onSendToInspection={handleSendToInspection}
                        onToggleTranscriptionExpand={(audioId) => {
                          const newSet = new Set(expandedTranscriptionIds);
                          if (expandedTranscriptionIds.has(audioId)) {
                            newSet.delete(audioId);
                          } else {
                            newSet.add(audioId);
                          }
                          setExpandedTranscriptionIds(newSet);
                        }}
                        onEditTranscription={handleOpenEditModal}
                        onUpdateMissionName={handleUpdateMissionName}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inspection" className="mt-6 h-full">
            <div className="h-[calc(100vh-8rem)] overflow-y-auto">
              <InspectionProcessor initialTranscription={inspectionTranscription} />
            </div>
          </TabsContent>
        </Tabs>
      </AppLayout>
    </div>
  );
}
