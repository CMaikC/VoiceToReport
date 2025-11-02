"use client";

import { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import { Button } from '@/app/components/ui/button';
import { Slider } from '@/app/components/ui/slider';
import { Play, Pause, Rewind, StopCircle } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export function AudioPlayer({ src }: AudioPlayerProps) {
  const [sound, setSound] = useState<Howl | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const newSound = new Howl({
      src: [src],
      html5: true,
      onload: () => setDuration(newSound.duration()),
      onplay: () => {
        setIsPlaying(true);
        intervalRef.current = window.setInterval(() => {
          setCurrentTime(newSound.seek());
        }, 1000);
      },
      onpause: () => setIsPlaying(false),
      onstop: () => {
        setIsPlaying(false);
        setCurrentTime(0);
      },
      onend: () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      },
    });
    setSound(newSound);

    return () => {
      newSound.unload();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [src]);

  const togglePlay = () => {
    if (sound) {
      if (isPlaying) sound.pause();
      else sound.play();
    }
  };

  const handleSeek = (value: number[]) => {
    if (sound) {
      const newTime = value[0];
      sound.seek(newTime);
      setCurrentTime(newTime);
    }
  };

  const handleRewind = () => {
    if (sound) {
        sound.seek(0);
        setCurrentTime(0);
    }
  };

  const handleStop = () => {
    if (sound) sound.stop();
  };

  return (
    <div className="w-full flex flex-col items-center space-y-2">
      <div className="w-full flex items-center space-x-2">
        <span className="text-xs font-mono text-muted-foreground">{formatTime(currentTime)}</span>
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={handleSeek}
          className="w-full"
        />
        <span className="text-xs font-mono text-muted-foreground">{formatTime(duration)}</span>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={handleRewind}>
          <Rewind className="h-6 w-6" />
        </Button>
        <Button variant="outline" size="icon" onClick={togglePlay} className="h-12 w-12 rounded-full">
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleStop}>
          <StopCircle className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
