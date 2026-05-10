import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  lyrics: string;
  cover: string;
}

interface LyricsContextType {
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const LyricsContext = createContext<LyricsContextType | undefined>(undefined);

export function LyricsProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <LyricsContext.Provider value={{ currentSong, setCurrentSong, isOpen, setIsOpen }}>
      {children}
    </LyricsContext.Provider>
  );
}

export function useLyrics() {
  const context = useContext(LyricsContext);
  if (context === undefined) {
    throw new Error('useLyrics must be used within a LyricsProvider');
  }
  return context;
}
