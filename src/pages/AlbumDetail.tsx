import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Heart, MoreHorizontal, Clock, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLyrics } from '../contexts/LyricsContext';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export function AlbumDetail() {
  const { albumId } = useParams();
  const { setCurrentSong, setIsOpen } = useLyrics();
  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState<any>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [similarAlbums, setSimilarAlbums] = useState<any[]>([]);

  useEffect(() => {
    if (album?.title) {
      document.title = `dullStar Collection - ${album.title}`;
    } else {
      document.title = "dullStar Collection - Album";
    }
  }, [album]);

  useEffect(() => {
    async function fetchData() {
      if (!albumId) return;
      setLoading(true);
      try {
        const albumRef = doc(db, 'albums', albumId);
        const albumDoc = await getDoc(albumRef);
        
        if (albumDoc.exists()) {
          const albumData = { id: albumId, ...albumDoc.data() } as any;
          setAlbum(albumData);
          
          // Fetch songs
          const songsQuery = query(
            collection(db, 'songs'), 
            where('albumId', '==', albumId)
          );
          const songsSnap = await getDocs(songsQuery);
          const tracks = songsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
          tracks.sort((a: any, b: any) => (a.trackNumber || 0) - (b.trackNumber || 0));
          setSongs(tracks);

          // Fetch similar albums
          if (albumData.similarAlbumIds && albumData.similarAlbumIds.length > 0) {
            const similarQuery = query(
              collection(db, 'albums'),
              where('__name__', 'in', albumData.similarAlbumIds)
            );
            const similarSnap = await getDocs(similarQuery);
            setSimilarAlbums(similarSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          } else {
            setSimilarAlbums([]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [albumId]);

  const handleSongClick = (song: any) => {
    if (song.unavailable) return;
    setCurrentSong({
      id: song.id,
      title: song.title,
      artist: album?.title || 'Album',
      album: album?.title || 'Unknown Album',
      lyrics: song.lyrics,
      cover: album?.coverImageUrl || ''
    });
    setIsOpen(true);
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
  if (!album) return <div className="p-20 text-center">Album not found</div>;

  return (
    <div className="flex flex-col">
      <div className="min-h-[320px] sm:min-h-[380px] md:min-h-[400px] pt-16 sm:pt-20 md:pt-24 bg-gradient-to-b from-zinc-700/40 via-zinc-900/60 to-spotify-dark flex flex-col md:flex-row items-center md:items-end p-4 sm:p-6 md:p-8 pb-6 sm:pb-8 md:pb-12 gap-5 sm:gap-6 md:gap-8 relative">
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <div className="w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-72 lg:h-72 shadow-2xl flex-shrink-0 z-10 transition-all duration-700 rounded-lg overflow-hidden border border-white/10">
          <img src={album.coverImageUrl} alt={album.title} className="w-full h-full object-cover shadow-2xl" referrerPolicy="no-referrer" />
        </div>
        <div className="flex flex-col gap-1.5 sm:gap-2 z-10 text-center md:text-left w-full min-w-0">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] opacity-80 text-zinc-300">Album</span>
          <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter drop-shadow-2xl break-words line-clamp-3 md:line-clamp-none">{album.title}</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2.5 gap-y-1 text-xs sm:text-sm font-bold mt-2 sm:mt-4 text-zinc-200">
             <div className="flex items-center gap-1.5 hover:underline cursor-pointer group">
                <div className="w-5 h-5 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                   <img src="https://picsum.photos/seed/dullstar/50" className="w-full h-full object-cover" />
                </div>
                <span className="truncate max-w-[140px] sm:max-w-none">{album?.title || 'Album'}</span>
             </div>
             <span className="text-zinc-500">•</span>
             <span className="text-zinc-300">{album.releaseYear}</span>
             <span className="text-zinc-500">•</span>
             <span className="text-zinc-300">{songs.length} songs</span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 relative bg-black/10 backdrop-blur-sm flex-1">
        <div className="flex items-center gap-4 sm:gap-8 mb-6 sm:mb-10">
           <div className="w-12 h-12 sm:w-14 sm:h-14 bg-spotify-green rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer group">
              <Play size={22} fill="black" className="ml-1 text-black" />
           </div>
        </div>

        <div className="grid grid-cols-[16px_1fr_40px] md:grid-cols-[16px_1fr_120px_40px] items-center gap-3 sm:gap-4 px-2 sm:px-4 py-2 sm:py-3 border-b border-white/5 text-zinc-400 text-xs font-black uppercase tracking-[0.2em] mb-2 sm:mb-4">
          <span className="text-center">#</span>
          <span>Title</span>
          <span className="hidden md:block">Plays</span>
          <span className="flex justify-end"><Clock size={16} /></span>
        </div>

        <div className="flex flex-col gap-1">
          {songs.map((song, i) => (
            <motion.div 
              key={song.id}
              whileHover={!song.unavailable ? { backgroundColor: 'rgba(255,255,255,0.08)' } : {}}
              onClick={() => handleSongClick(song)}
              className={`grid grid-cols-[16px_1fr_40px] md:grid-cols-[16px_1fr_120px_40px] items-center gap-3 sm:gap-4 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg group transition-colors ${song.unavailable ? 'opacity-30 cursor-default' : 'cursor-pointer active:bg-white/10'}`}
            >
              <span className="text-zinc-400 text-xs sm:text-sm font-medium w-4 text-center group-hover:text-white transition-colors">{i + 1}</span>
              <div className="flex flex-col min-w-0 pr-1">
                <span className={`font-bold text-sm sm:text-base transition-colors truncate ${song.unavailable ? 'text-zinc-500' : 'text-white group-hover:text-spotify-green'}`}>{song.title}</span>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-400">
                  <span className="truncate group-hover:text-white transition-colors">{album?.title || 'Album'}</span>
                  <span className="md:hidden text-zinc-500">•</span>
                  <span className="md:hidden font-mono text-zinc-400">{song.streamCount || '142,501'}</span>
                </div>
              </div>
              <span className="hidden md:block text-sm font-mono text-zinc-400">{song.streamCount || '142,501'}</span>
              <span className="text-xs sm:text-sm font-mono text-zinc-400 text-right">{song.duration || '3:30'}</span>
            </motion.div>
          ))}
          {songs.length === 0 && (
            <div className="py-10 text-center text-zinc-500 italic text-sm">This album is empty.</div>
          )}
        </div>

        {/* Similar Albums Section */}
        {similarAlbums.length > 0 && (
          <section className="mt-12 sm:mt-20">
            <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 tracking-tight">Similarly</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
              {similarAlbums.map((simAlbum) => (
                <Link 
                  key={simAlbum.id}
                  to={`/album/${simAlbum.id}`}
                  className="bg-zinc-900/40 p-3 sm:p-4 rounded-xl hover:bg-zinc-800/60 transition-all duration-300 group cursor-pointer border border-white/5 active:scale-[0.98]"
                >
                  <div className="relative mb-3 aspect-square shadow-2xl overflow-hidden rounded-lg">
                    <img src={simAlbum.coverImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    <div className="absolute right-2.5 bottom-2.5 sm:right-3 sm:bottom-3 w-10 h-10 sm:w-12 sm:h-12 bg-spotify-green rounded-full shadow-xl flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <Play size={20} fill="black" className="ml-1 text-black" />
                    </div>
                  </div>
                  <h3 className="font-bold truncate mb-0.5 text-sm sm:text-base">{simAlbum.title}</h3>
                  <span className="text-xs sm:text-sm text-zinc-400 font-medium">{simAlbum.releaseYear} • Album</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
