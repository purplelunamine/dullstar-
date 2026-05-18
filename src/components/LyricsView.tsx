import React from 'react';
import { useLyrics } from '../contexts/LyricsContext';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function LyricsView() {
  const { currentSong, isOpen, setIsOpen } = useLyrics();

  if (!currentSong) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 text-white flex flex-col p-8 md:p-16 overflow-y-auto backdrop-blur-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-zinc-900/40 pointer-events-none" />
          
          <header className="relative z-10 flex justify-between items-center mb-16">
            <div className="flex items-center gap-6">
               <img src={currentSong.cover} className="w-16 h-16 rounded shadow-2xl border border-white/10" referrerPolicy="no-referrer" />
               <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tight">{currentSong.title}</span>
                  <span className="text-spotify-green font-bold">{currentSong.artist}</span>
               </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            >
              <X size={28} />
            </button>
          </header>

          <div className="relative z-10 flex-1 flex flex-col max-w-4xl mx-auto w-full pb-32">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] opacity-30 mb-12 flex items-center justify-center gap-4">
              <div className="h-[1px] w-8 bg-current" />
              Lyrics
              <div className="h-[1px] w-8 bg-current" />
            </h2>
            <div className="lyrics-content px-4">
              {currentSong.lyrics}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
