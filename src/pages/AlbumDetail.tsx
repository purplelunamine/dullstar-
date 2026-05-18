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
      <div className="min-h-[400px] pt-24 bg-gradient-to-b from-zinc-700/40 to-spotify-dark flex flex-col md:flex-row items-center md:items-end p-8 pb-12 gap-8 relative">
        <div className="absolute inset-0 bg-black/20" />
        <div className="w-56 h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 shadow-2xl flex-shrink-0 z-10 transition-all duration-700">
          <img src={album.coverImageUrl} alt={album.title} className="w-full h-full object-cover shadow-2xl border border-white/5 rounded-sm" referrerPolicy="no-referrer" />
        </div>
        <div className="flex flex-col gap-2 z-10 text-center md:text-left w-full">
          <span className="text-xs font-black uppercase tracking-[0.3em] opacity-80">Album</span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter drop-shadow-2xl line-clamp-2 md:line-clamp-none">{album.title}</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-sm font-bold mt-4">
             <div className="flex items-center gap-2 hover:underline cursor-pointer group">
                <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden">
                   <img src="https://picsum.photos/seed/dullstar/50" className="w-full h-full object-cover" />
                </div>
                <span>{album?.title || 'Album'}</span>
             </div>
             <span className="text-zinc-400">•</span>
             <span className="text-zinc-100">{album.releaseYear}</span>
             <span className="text-zinc-400">•</span>
             <span className="text-zinc-100">{songs.length} songs</span>
          </div>
        </div>
      </div>

      <div className="p-8 relative bg-black/10 backdrop-blur-sm flex-1">
        <div className="flex items-center gap-8 mb-10">
           <div className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer group">
              <Play size={24} fill="black" className="ml-1 text-black" />
           </div>
        </div>

        <div className="grid grid-cols-[16px_1fr_120px_40px] items-center gap-4 px-4 py-3 border-b border-white/5 text-zinc-400 text-xs font-black uppercase tracking-[0.2em] mb-4">
          <span className="text-center">#</span>
          <span>Title</span>
          <span>Plays</span>
          <span className="flex justify-end"><Clock size={16} /></span>
        </div>

        <div className="flex flex-col gap-0.5">
          {songs.map((song, i) => (
            <motion.div 
              key={song.id}
              whileHover={!song.unavailable ? { backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
              onClick={() => handleSongClick(song)}
              className={`grid grid-cols-[16px_1fr_120px_40px] items-center gap-4 px-4 py-2.5 rounded-md group transition-colors ${song.unavailable ? 'opacity-30 cursor-default' : 'cursor-pointer'}`}
            >
              <span className="text-zinc-400 text-sm font-medium w-4 group-hover:text-white transition-colors">{i + 1}</span>
              <div className="flex flex-col min-w-0">
                <span className={`font-bold transition-colors truncate ${song.unavailable ? 'text-zinc-500' : 'text-white group-hover:text-spotify-green'}`}>{song.title}</span>
                <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">{album?.title || 'Album'}</span>
              </div>
              <span className="text-sm font-mono text-zinc-400">{song.streamCount || '142,501'}</span>
              <span className="text-sm font-mono text-zinc-400 text-right">{song.duration || '3:30'}</span>
            </motion.div>
          ))}
          {songs.length === 0 && (
            <div className="py-10 text-center text-zinc-500 italic">This album is empty.</div>
          )}
        </div>

        {/* Similar Albums Section */}
        {similarAlbums.length > 0 && (
          <section className="mt-24">
            <h2 className="text-2xl font-black mb-8 tracking-tight">Similarly</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {similarAlbums.map((simAlbum) => (
                <Link 
                  key={simAlbum.id}
                  to={`/album/${simAlbum.id}`}
                  className="bg-zinc-900/40 p-4 rounded-xl hover:bg-zinc-800/60 transition-all duration-300 group cursor-pointer border border-white/5"
                >
                  <div className="relative mb-4 aspect-square shadow-2xl overflow-hidden rounded-lg">
                    <img src={simAlbum.coverImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    <div className="absolute right-3 bottom-3 w-12 h-12 bg-spotify-green rounded-full shadow-xl flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <Play size={24} fill="black" className="ml-1 text-black" />
                    </div>
                  </div>
                  <h3 className="font-bold truncate mb-1 text-lg">{simAlbum.title}</h3>
                  <span className="text-sm text-zinc-400 font-bold">{simAlbum.releaseYear} • Album</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
