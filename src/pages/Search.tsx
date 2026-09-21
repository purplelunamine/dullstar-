import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Loader2, Play } from 'lucide-react';
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
    <div className="p-4 sm:p-6 md:p-8 pt-16 md:pt-8">
      <div className="max-w-2xl mb-8 sm:mb-12 relative group">
        <SearchIcon className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-white transition-colors" size={20} />
        <input 
          type="text"
          placeholder="What do you want to listen to?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-white/5 rounded-full py-3 sm:py-4 pl-11 sm:pl-14 pr-4 sm:pr-6 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-500"
        />
      </div>

      {!query ? (
        <section>
          <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-8 tracking-tight">Browse all</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
             {/* Browse Categories */}
             {[
               { name: 'Pop', color: 'bg-pink-600' },
               { name: 'Rock', color: 'bg-red-800' },
               { name: 'Electronic', color: 'bg-indigo-900' },
               { name: 'Indie', color: 'bg-teal-700' },
               { name: 'Hip Hop', color: 'bg-orange-700' },
               { name: 'Acoustic', color: 'bg-zinc-800' }
             ].map(genre => (
               <div key={genre.name} className={cn("aspect-square rounded-xl p-3 sm:p-4 font-black text-lg sm:text-2xl relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg", genre.color)}>
                  {genre.name}
                  <img src={`https://picsum.photos/seed/${genre.name}/150`} className="absolute -right-3 -bottom-3 sm:-right-4 sm:-bottom-4 w-20 h-20 sm:w-28 sm:h-28 rotate-[25deg] shadow-2xl rounded-sm" referrerPolicy="no-referrer" />
               </div>
             ))}
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-10 sm:gap-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-8 md:gap-12">
            <section>
              <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 tracking-tight">{filteredAlbums.length > 0 ? 'Top result' : 'No results found'}</h2>
              {filteredAlbums[0] && (
                <div 
                  onClick={() => navigate(`/album/${filteredAlbums[0].id}`)}
                  className="bg-zinc-900 p-5 sm:p-8 rounded-2xl hover:bg-zinc-800 transition-all duration-300 cursor-pointer group shadow-2xl border border-white/5 active:scale-[0.99]"
                >
                  <img src={filteredAlbums[0].coverImageUrl} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg shadow-2xl mb-4 sm:mb-8 shadow-black/80 group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                  <h3 className="text-2xl sm:text-4xl font-black mb-2 sm:mb-4 group-hover:underline tracking-tight truncate">{filteredAlbums[0].title}</h3>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-zinc-400 font-bold text-xs sm:text-sm">Album</span>
                    <span className="bg-spotify-dark/60 text-white px-3 py-0.5 sm:px-4 sm:py-1 rounded-full uppercase text-[9px] sm:text-[10px] font-black tracking-widest border border-white/10">Artist</span>
                  </div>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 tracking-tight">Songs</h2>
              <div className="flex flex-col gap-1">
                {filteredSongs.map((song) => {
                  const album = albums.find(a => a.id === song.albumId);
                  return (
                    <div 
                      key={song.id} 
                      onClick={() => handleSongClick(song)}
                      className={`flex items-center gap-3 sm:gap-4 p-2 sm:p-2.5 rounded-lg transition-colors group ${song.unavailable ? 'opacity-30 cursor-default' : 'hover:bg-white/10 active:bg-white/10 cursor-pointer'}`}
                    >
                      <img src={album?.coverImageUrl} className="w-10 h-10 sm:w-12 sm:h-12 rounded shadow-md object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                      <div className="flex flex-col flex-1 min-w-0 pr-1">
                        <span className={`font-bold text-sm sm:text-base transition-colors truncate ${song.unavailable ? 'text-zinc-500' : 'text-white group-hover:text-spotify-green'}`}>{song.title}</span>
                        <span className="text-xs text-zinc-400 font-medium truncate">{album?.title || 'Album'}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-mono text-zinc-400 group-hover:text-white transition-colors">{song.duration || '3:30'}</span>
                    </div>
                  );
                })}
                {filteredSongs.length === 0 && <p className="text-zinc-500 italic py-10 text-sm text-center">No songs match your search.</p>}
              </div>
            </section>
          </div>

          {/* Dedicated Albums Search Results Section */}
          {filteredAlbums.length > 0 && (
            <section>
              <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 tracking-tight">Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                {filteredAlbums.map((album) => (
                  <div 
                    key={album.id}
                    onClick={() => navigate(`/album/${album.id}`)}
                    className="bg-zinc-900/40 p-3 sm:p-5 rounded-xl sm:rounded-2xl hover:bg-zinc-800/60 transition-all duration-300 group cursor-pointer border border-white/5 flex flex-col h-full active:scale-[0.98]"
                  >
                    <div className="relative mb-3 sm:mb-4 aspect-square shadow-2xl overflow-hidden rounded-lg sm:rounded-xl">
                      <img 
                        src={album.coverImageUrl} 
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="absolute right-2.5 bottom-2.5 sm:right-4 sm:bottom-4 w-10 h-10 sm:w-12 sm:h-12 bg-spotify-green rounded-full shadow-xl flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                        <Play size={20} fill="black" className="ml-1 text-black" />
                      </div>
                    </div>
                    <div className="mt-auto">
                      <h3 className="font-bold truncate mb-0.5 sm:mb-1 text-sm sm:text-lg group-hover:text-spotify-green transition-colors">{album.title}</h3>
                      <p className="text-xs sm:text-sm text-zinc-400 font-medium line-clamp-1">
                        {album.releaseYear} • Album
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
