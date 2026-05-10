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
    <div className="p-8 min-h-full">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors group"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <h1 className="text-4xl font-black tracking-tight">Discography</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {albums.map((album) => (
          <div 
            key={album.id}
            onClick={() => navigate(`/album/${album.id}`)}
            className="bg-zinc-900/40 p-5 rounded-2xl hover:bg-zinc-800/60 transition-all duration-300 group cursor-pointer border border-white/5 flex flex-col h-full"
          >
            <div className="relative mb-4 aspect-square shadow-2xl overflow-hidden rounded-xl">
              <img 
                src={album.coverImageUrl} 
                alt={album.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute right-4 bottom-4 w-12 h-12 bg-spotify-green rounded-full shadow-xl flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                <Play size={24} fill="black" className="ml-1 text-black" />
              </div>
            </div>
            <div className="mt-auto">
              <h3 className="font-bold truncate mb-1 text-lg group-hover:text-spotify-green transition-colors">{album.title}</h3>
              <p className="text-sm text-zinc-400 font-bold line-clamp-1">
                {album.releaseYear} • Album
              </p>
            </div>
          </div>
        ))}

        {albums.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
              <Play size={32} />
            </div>
            <p className="text-zinc-500 italic font-bold">No records found in the library.</p>
          </div>
        )}
      </div>
    </div>
  );
}
