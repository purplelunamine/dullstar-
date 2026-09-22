import React, { useState, useEffect } from 'react';
import { Play, Heart, MoreHorizontal, Loader2, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLyrics } from '../contexts/LyricsContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAlbums, getSongs, getArtist } from '../services/db';

export function Home() {
  const { setCurrentSong, setIsOpen } = useLyrics();
  const { user } = useAuth();
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

        const allSongs = songsData || [];
        const explicitlyPopular = allSongs.filter((s: any) => s.isPopular === true);

        if (explicitlyPopular.length > 0) {
          explicitlyPopular.sort((a: any, b: any) => (a.popularOrder ?? 999) - (b.popularOrder ?? 999));
          setPopularSongs(explicitlyPopular);
        } else {
          setPopularSongs(allSongs.slice(0, 5));
        }
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

  const artistImage = artist?.profilePictureUrl || "https://i.ibb.co/67ts7TTD/dullstar.png";

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Header */}
      <div className="min-h-[340px] sm:min-h-[380px] md:h-[450px] relative flex flex-col justify-end p-4 sm:p-6 md:p-8 pt-16 sm:pt-20 md:pt-8 pb-6 sm:pb-8 md:pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-blue-950/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-5 sm:gap-6 md:gap-8">
          <div className="w-32 h-32 sm:w-44 sm:h-44 md:w-64 md:h-64 rounded-full bg-zinc-800 shadow-2xl border-4 sm:border-8 border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 group">
             <img 
               src={artistImage} 
               alt="dullStar profile" 
               className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
               referrerPolicy="no-referrer"
             />
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1.5 sm:gap-2 mb-2 max-w-full">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 rounded-full p-1 shadow-lg shadow-blue-500/20">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-blue-200">Verified Artist</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter drop-shadow-2xl break-words line-clamp-2 md:line-clamp-none">{artist?.name || 'dullStar'}</h1>
            <span className="text-xs sm:text-sm font-bold mt-1 sm:mt-2 opacity-90 text-zinc-300">{artist?.monthlyListeners || '1,492,058'} monthly listeners</span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 md:gap-12">
          {/* Popular Section */}
          {popularSongs.length > 0 && (
            <section className="mb-6 md:mb-12">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Popular</h2>
                {user && (
                  <button 
                    onClick={() => navigate('/admin?tab=popular')}
                    className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-zinc-300 hover:text-spotify-green transition-colors bg-zinc-900 border border-zinc-700 hover:border-spotify-green/50 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full"
                  >
                    <Edit2 size={12} />
                    Edit Popular
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {popularSongs.map((song, i) => {
                  const album = albums.find(a => a.id === song.albumId);
                  const isSongUnavailable = song.unavailable || album?.unavailable;
                  return (
                    <motion.div 
                      key={song.id}
                      whileHover={!isSongUnavailable ? { backgroundColor: 'rgba(255,255,255,0.08)' } : {}}
                      onClick={() => !isSongUnavailable && handleSongClick(song)}
                      className={`grid grid-cols-[16px_36px_1fr_auto] sm:grid-cols-[20px_40px_1fr_100px] items-center gap-2.5 sm:gap-4 px-2.5 sm:px-4 py-2 rounded-lg group transition-colors ${isSongUnavailable ? 'opacity-30 cursor-default' : 'cursor-pointer active:bg-white/10'}`}
                    >
                      <span className="text-zinc-400 text-xs sm:text-sm font-medium w-4 text-center">{i + 1}</span>
                      <img src={album?.coverImageUrl || 'https://picsum.photos/seed/song/100'} className={`w-9 h-9 sm:w-10 sm:h-10 rounded-sm shadow-md object-cover flex-shrink-0 ${isSongUnavailable ? 'grayscale' : ''}`} referrerPolicy="no-referrer" />
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className={`font-bold text-sm sm:text-base transition-colors truncate ${isSongUnavailable ? 'text-zinc-500' : 'text-white group-hover:text-spotify-green'}`}>{song.title}</span>
                        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400 font-medium truncate">
                          {album?.title && <span className={`truncate max-w-[120px] sm:max-w-none ${!album?.unavailable ? 'hover:underline cursor-pointer' : ''}`} onClick={(e) => { if (!album?.unavailable) { e.stopPropagation(); navigate(`/album/${album.id}`); } }}>{album.title}</span>}
                          {album?.title && <span>•</span>}
                          <span className="font-mono">{song.streamCount || '142,501,003'}</span>
                        </div>
                      </div>
                      <span className="text-zinc-400 text-xs sm:text-sm text-right font-mono flex-shrink-0">{song.duration || '3:30'}</span>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Albums Section */}
          <section>
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Discography</h2>
              {albums.length > 4 && (
                <button 
                  onClick={() => navigate('/discography')}
                  className="text-xs sm:text-sm font-bold text-zinc-400 hover:underline cursor-pointer"
                >
                  Show all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {albums.slice(0, 4).map((album) => {
                const isUnavailable = !!album.unavailable;
                return (
                  <div 
                    key={album.id}
                    onClick={() => {
                      if (!isUnavailable) navigate(`/album/${album.id}`);
                    }}
                    className={`p-3 sm:p-4 rounded-xl border border-white/5 transition-all duration-300 ${
                      isUnavailable 
                        ? 'bg-zinc-900/20 opacity-30 cursor-default grayscale' 
                        : 'bg-zinc-900/40 hover:bg-zinc-800/60 group cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <div className="relative mb-3 aspect-square shadow-2xl overflow-hidden rounded-lg">
                      <img 
                        src={album.coverImageUrl} 
                        className={`w-full h-full object-cover transition-transform duration-500 ${!isUnavailable ? 'group-hover:scale-105' : ''}`} 
                        referrerPolicy="no-referrer" 
                      />
                      {!isUnavailable && (
                        <div className="absolute right-2.5 bottom-2.5 sm:right-3 sm:bottom-3 w-10 h-10 sm:w-12 sm:h-12 bg-spotify-green rounded-full shadow-xl flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <Play size={20} fill="black" className="ml-1 text-black" />
                        </div>
                      )}
                    </div>
                    <h3 className={`font-bold truncate mb-0.5 text-sm sm:text-base transition-colors ${isUnavailable ? 'text-zinc-500' : 'text-white group-hover:text-spotify-green'}`}>
                      {album.title}
                    </h3>
                    <span className="text-xs sm:text-sm text-zinc-400 font-medium">
                      {album.releaseYear} • Album {isUnavailable && '• Unavailable'}
                    </span>
                  </div>
                );
              })}
              {albums.length === 0 && (
                <div className="col-span-full py-10 text-zinc-500 italic text-center text-sm">No albums discovered yet.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
