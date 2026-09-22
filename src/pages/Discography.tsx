import React, { useState, useEffect } from 'react';
import { Play, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAlbums } from '../services/db';

export function Discography() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState<any[]>([]);

  useEffect(() => {
    document.title = "dullStar Collection - Discography";
  }, []);

  useEffect(() => {
    async function fetchAlbumsData() {
      try {
        const albumsData = await getAlbums();
        setAlbums(albumsData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlbumsData();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-spotify-green" size={48} />
      <span className="text-zinc-400 font-bold animate-pulse">Scanning the archives...</span>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 pt-16 md:pt-8 min-h-full">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <button 
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="p-2 hover:bg-white/10 active:bg-white/20 rounded-full transition-colors group"
        >
          <ArrowLeft size={20} className="sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform" />
        </button>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Discography</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
        {albums.map((album) => {
          const isUnavailable = !!album.unavailable;
          return (
            <div 
              key={album.id}
              onClick={() => {
                if (!isUnavailable) navigate(`/album/${album.id}`);
              }}
              className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-white/5 flex flex-col h-full transition-all duration-300 ${
                isUnavailable 
                  ? 'bg-zinc-900/20 opacity-30 cursor-default grayscale' 
                  : 'bg-zinc-900/40 hover:bg-zinc-800/60 group cursor-pointer active:scale-[0.98]'
              }`}
            >
              <div className="relative mb-3 sm:mb-4 aspect-square shadow-2xl overflow-hidden rounded-lg sm:rounded-xl">
                <img 
                  src={album.coverImageUrl} 
                  alt={album.title}
                  className={`w-full h-full object-cover transition-transform duration-700 ${!isUnavailable ? 'group-hover:scale-105' : ''}`} 
                  referrerPolicy="no-referrer" 
                />
                {!isUnavailable && (
                  <div className="absolute right-2.5 bottom-2.5 sm:right-4 sm:bottom-4 w-10 h-10 sm:w-12 sm:h-12 bg-spotify-green rounded-full shadow-xl flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                    <Play size={20} fill="black" className="ml-1 text-black" />
                  </div>
                )}
              </div>
              <div className="mt-auto">
                <h3 className={`font-bold truncate mb-0.5 sm:mb-1 text-sm sm:text-lg transition-colors ${isUnavailable ? 'text-zinc-500' : 'group-hover:text-spotify-green'}`}>{album.title}</h3>
                <p className="text-xs sm:text-sm text-zinc-400 font-medium line-clamp-1">
                  {album.releaseYear} • Album {isUnavailable && '• Unavailable'}
                </p>
              </div>
            </div>
          );
        })}

        {albums.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
              <Play size={28} />
            </div>
            <p className="text-zinc-500 italic font-bold text-sm sm:text-base">No records found in the library.</p>
          </div>
        )}
      </div>
    </div>
  );
}
