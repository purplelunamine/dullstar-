import React from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ChevronLeft, ChevronRight, User, Home, Search, Disc3, ShieldCheck } from 'lucide-react';
import { LyricsView } from './LyricsView';
import { useLyrics } from '../contexts/LyricsContext';
import { cn } from '../lib/utils';

export function Layout() {
  const { currentSong } = useLyrics();
  const navigate = useNavigate();
  const location = useLocation();

  const mobileNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Disc3, label: 'Discography', path: '/discography' },
    { icon: ShieldCheck, label: 'Admin', path: '/admin' },
  ];

  return (
    <div id="app-container" className="flex h-screen w-full bg-black text-white font-sans overflow-hidden select-none">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 bg-spotify-dark overflow-hidden relative spotify-gradient">
        {/* Top Header */}
        <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-8 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all border border-white/10 text-white cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => navigate(1)}
              aria-label="Go forward"
              className="w-8 h-8 rounded-full bg-black/60 hidden sm:flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 pointer-events-auto">
            <Link 
              to="/admin" 
              className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-1 sm:px-4 sm:py-1.5 hover:bg-black/80 transition-colors border border-white/10 group"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                 <User size={14} className="text-zinc-200" />
              </div>
              <span className="text-xs font-bold tracking-wide group-hover:scale-105 transition-transform">Admin</span>
            </Link>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div id="scroll-content" className="flex-1 overflow-y-auto scroll-smooth bg-black/20 backdrop-blur-md pb-24 md:pb-0">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav 
          aria-label="Mobile Navigation" 
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around safe-area-bottom"
        >
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-1 px-2 text-[11px] font-bold transition-all duration-200",
                  isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <item.icon 
                  size={20} 
                  className={cn("mb-1 transition-transform duration-200", isActive && "text-spotify-green scale-110")} 
                />
                <span className={cn("truncate max-w-[70px]", isActive ? "text-white font-black" : "text-zinc-400")}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </main>

      <LyricsView />
    </div>
  );
}
