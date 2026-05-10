import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ChevronLeft, ChevronRight, User, Mic2 } from 'lucide-react';
import { LyricsView } from './LyricsView';
import { useLyrics } from '../contexts/LyricsContext';

export function Layout() {
  const { currentSong, setIsOpen } = useLyrics();

  return (
    <div id="app-container" className="flex h-screen w-full bg-black text-white font-sans overflow-hidden select-none">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 bg-spotify-dark overflow-hidden relative spotify-gradient">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 absolute top-0 left-0 right-0 z-10 bg-transparent">
          <div className="flex gap-4">
            <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors border border-white/5">
              <ChevronLeft size={20} />
            </button>
            <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors border border-white/5 text-zinc-600">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to="/admin" className="flex items-center gap-2 bg-black/40 rounded-full px-4 py-1.5 hover:bg-black/60 transition-colors border border-white/10 group">
              <div className="w-6 h-6 rounded-full bg-zinc-600 flex items-center justify-center overflow-hidden">
                 <User size={16} className="text-zinc-200" />
              </div>
              <span className="text-xs font-bold tracking-wide group-hover:scale-105 transition-transform">Admin</span>
            </Link>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div id="scroll-content" className="flex-1 overflow-y-auto scroll-smooth bg-black/20 backdrop-blur-md">
          <Outlet />
        </div>
      </main>

      <LyricsView />
    </div>
  );
}
