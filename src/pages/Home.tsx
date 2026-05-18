import React, { useState, useEffect } from 'react';
import { Play, Heart, MoreHorizontal, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLyrics } from '../contexts/LyricsContext';
import { useNavigate } from 'react-router-dom';
import { getAlbums, getSongs, getArtist } from '../services/db';

export function Home() {
  const { setCurrentSong, setIsOpen } = useLyrics();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState<any>(null);
  const [popularSongs, setPopularSongs] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);

  useEffect(() => {
    document.title = "dullStar Collection - Home";
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [artistData, albumsData, songsData] = await Promise.all([
          getArtist('dullstar'),
          getAlbums(),
          getSongs()
        ]);
        setArtist(artistData);
        setAlbums(albumsData || []);
        // Just take first 5 for "popular" for now
        setPopularSongs(songsData?.slice(0, 5) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSongClick = (song: any) => {
    if (song.unavailable) return;
    // Find the album cover for this song
    const album = albums.find(a => a.id === song.albumId);
    setCurrentSong({
      id: song.id,
      title: song.title,
      artist: album?.title || artist?.name || 'Album',
      album: album?.title || 'Unknown Album',
      lyrics: song.lyrics,
      cover: album?.coverImageUrl || 'https://picsum.photos/seed/dullstar/400'
    });
    setIsOpen(true);
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  const artistImage = artist?.profilePictureUrl || "https://picsum.photos/seed/dullstar/400";

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Header */}
      <div className="h-96 md:h-[450px] relative flex flex-col justify-end p-8 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-transparent" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-zinc-800 shadow-2xl border-8 border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 group">
             <img 
               src={artistImage} 
               alt="dullStar profile" 
               className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
               referrerPolicy="no-referrer"
             />
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 rounded-full p-1 shadow-lg shadow-blue-500/20">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Verified Artist</span>
            </div>
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter drop-shadow-2xl">{artist?.name || 'dullStar'}</h1>
            <span className="text-sm font-bold mt-2 opacity-90">{artist?.monthlyListeners || '1,492,058'} monthly listeners</span>
          </div>
        </div>
      </div>

      <div className="p-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12">
          {/* Popular Section */}
          {popularSongs.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 tracking-tight">Popular</h2>
              <div className="flex flex-col gap-0.5">
                {popularSongs.map((song, i) => {
                  const album = albums.find(a => a.id === song.albumId);
                  return (
                    <motion.div 
                      key={song.id}
                      whileHover={!song.unavailable ? { backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
                      onClick={() => handleSongClick(song)}
                      className={`grid grid-cols-[16px_40px_1fr_100px] items-center gap-4 px-4 py-2 rounded-md group transition-colors ${song.unavailable ? 'opacity-30 cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="text-zinc-400 text-sm font-medium w-4">{i + 1}</span>
                      <img src={album?.coverImageUrl || 'https://picsum.photos/seed/song/100'} className="w-10 h-10 rounded-sm shadow-md" referrerPolicy="no-referrer" />
                      <div className="flex flex-col min-w-0">
                        <span className={`font-bold transition-colors truncate ${song.unavailable ? 'text-zinc-500' : 'text-white group-hover:text-spotify-green'}`}>{song.title}</span>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold truncate">
                          {album?.title && <span className="hover:underline cursor-pointer">{album.title}</span>}
                          {album?.title && <span>•</span>}
                          <span>{song.streamCount || '142,501,003'}</span>
                        </div>
                      </div>
                      <span className="text-zinc-400 text-sm text-right font-mono">{song.duration || '3:30'}</span>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Albums Section */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Discography</h2>
              {albums.length > 4 && (
                <button 
                  onClick={() => navigate('/discography')}
                  className="text-sm font-bold text-zinc-400 hover:underline cursor-pointer"
                >
                  Show all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {albums.slice(0, 4).map((album) => (
                <div 
                  key={album.id}
                  onClick={() => navigate(`/album/${album.id}`)}
                  className="bg-zinc-900/40 p-4 rounded-xl hover:bg-zinc-800/60 transition-all duration-300 group cursor-pointer border border-white/5"
                >
                  <div className="relative mb-4 aspect-square shadow-2xl overflow-hidden rounded-lg">
                    <img src={album.coverImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    <div className="absolute right-3 bottom-3 w-12 h-12 bg-spotify-green rounded-full shadow-xl flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <Play size={24} fill="black" className="ml-1 text-black" />
                    </div>
                  </div>
                  <h3 className="font-bold truncate mb-1 text-lg">{album.title}</h3>
                  <span className="text-sm text-zinc-400 font-bold">{album.releaseYear} • Album</span>
                </div>
              ))}
              {albums.length === 0 && (
                <div className="col-span-full py-10 text-zinc-500 italic">No albums discovered yet.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
