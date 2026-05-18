import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { getAlbums, getSongs } from '../services/db';
import { useLyrics } from '../contexts/LyricsContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export function Search() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState<any[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const { setCurrentSong, setIsOpen } = useLyrics();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "dullStar Collection - Search";
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [a, s] = await Promise.all([getAlbums(), getSongs()]);
        setAlbums(a || []);
        setSongs(s || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredAlbums = albums.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleSongClick = (song: any) => {
    if (song.unavailable) return;
    const album = albums.find(a => a.id === song.albumId);
    setCurrentSong({
      id: song.id,
      title: song.title,
      artist: album?.title || 'Album',
      album: album?.title || 'Unknown',
      lyrics: song.lyrics,
      cover: album?.coverImageUrl || ''
    });
    setIsOpen(true);
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8">
      <div className="max-w-2xl mb-12 relative group">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-white transition-colors" size={24} />
        <input 
          type="text"
          placeholder="What do you want to listen to?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-white/5 rounded-full py-4 pl-14 pr-6 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-500"
        />
      </div>

      {!query ? (
        <section>
          <h2 className="text-2xl font-black mb-8 tracking-tight">Browse all</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
             {/* Browse Categories */}
             {[
               { name: 'Pop', color: 'bg-pink-600' },
               { name: 'Rock', color: 'bg-red-800' },
               { name: 'Electronic', color: 'bg-indigo-900' },
               { name: 'Indie', color: 'bg-teal-700' },
               { name: 'Hip Hop', color: 'bg-orange-700' },
               { name: 'Acoustic', color: 'bg-zinc-800' }
             ].map(genre => (
               <div key={genre.name} className={cn("aspect-square rounded-xl p-4 font-black text-2xl relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform shadow-lg", genre.color)}>
                  {genre.name}
                  <img src={`https://picsum.photos/seed/${genre.name}/150`} className="absolute -right-4 -bottom-4 w-28 h-28 rotate-[25deg] shadow-2xl rounded-sm" referrerPolicy="no-referrer" />
               </div>
             ))}
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-12">
          <section>
            <h2 className="text-2xl font-black mb-6 tracking-tight">{filteredAlbums.length > 0 ? 'Top result' : 'No results found'}</h2>
            {filteredAlbums[0] && (
              <div 
                onClick={() => navigate(`/album/${filteredAlbums[0].id}`)}
                className="bg-zinc-900 p-8 rounded-2xl hover:bg-zinc-800 transition-all duration-300 cursor-pointer group shadow-2xl border border-white/5"
              >
                <img src={filteredAlbums[0].coverImageUrl} className="w-24 h-24 rounded-lg shadow-2xl mb-8 shadow-black/80 group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                <h3 className="text-4xl font-black mb-4 group-hover:underline tracking-tight">{filteredAlbums[0].title}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 font-bold text-sm">Album</span>
                  <span className="bg-spotify-dark/60 text-white px-4 py-1 rounded-full uppercase text-[10px] font-black tracking-widest border border-white/10">Artist</span>
                </div>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-black mb-6 tracking-tight">Songs</h2>
            <div className="flex flex-col gap-0.5">
              {filteredSongs.map((song) => {
                const album = albums.find(a => a.id === song.albumId);
                return (
                  <div 
                    key={song.id} 
                    onClick={() => handleSongClick(song)}
                    className={`flex items-center gap-4 p-2.5 rounded-lg transition-colors group ${song.unavailable ? 'opacity-30 cursor-default' : 'hover:bg-white/10 cursor-pointer'}`}
                  >
                    <img src={album?.coverImageUrl} className="w-12 h-12 rounded shadow-md" referrerPolicy="no-referrer" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={`font-bold transition-colors truncate ${song.unavailable ? 'text-zinc-500' : 'text-white group-hover:text-spotify-green'}`}>{song.title}</span>
                      <span className="text-xs text-zinc-400 font-bold truncate">{album?.title || 'Album'}</span>
                    </div>
                    <span className="text-sm font-mono text-zinc-400 group-hover:text-white transition-colors">{song.duration || '3:30'}</span>
                  </div>
                );
              })}
              {filteredSongs.length === 0 && <p className="text-zinc-500 italic py-10">No songs match your search.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
