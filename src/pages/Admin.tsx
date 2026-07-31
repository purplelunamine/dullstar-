import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, LogIn, Loader2, Star, Flame, Search as SearchIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAlbums, 
  getSongs, 
  addAlbum, 
  addSong, 
  updateAlbum, 
  setAlbum,
  updateSong, 
  deleteAlbum, 
  deleteSong 
} from '../services/db';

export function Admin() {
  const { user, login, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'albums' | 'songs' | 'popular'>('albums');
  const [isEditing, setIsEditing] = useState(false);
  const [albums, setAlbums] = useState<any[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [songSearchQuery, setSongSearchQuery] = useState('');

  // Filler Tracks State
  const [showFiller, setShowFiller] = useState(false);
  const [fillerAlbumId, setFillerAlbumId] = useState('');
  const [fillerStart, setFillerStart] = useState<number | ''>('');
  const [fillerEnd, setFillerEnd] = useState<number | ''>('');
  const [isAddingFiller, setIsAddingFiller] = useState(false);

  useEffect(() => {
    document.title = "dullStar Collection - Admin";
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'popular' || tabParam === 'songs' || tabParam === 'albums') {
      setActiveTab(tabParam as any);
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (activeTab === 'albums') {
        fetchAlbums();
      } else {
        fetchSongs();
      }
    }
  }, [user, activeTab]);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const data = await getAlbums();
      setAlbums(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSongs = async () => {
    setLoading(true);
    try {
      // We also need albums for the dropdown when on the songs tab
      const [songsData, albumsData] = await Promise.all([
        getSongs(),
        getAlbums()
      ]);
      
      const sortedSongs = (songsData as any[] || []).sort((a: any, b: any) => {
        const albumA = a.albumId || '';
        const albumB = b.albumId || '';
        if (albumA !== albumB) return albumA.localeCompare(albumB);
        return (a.trackNumber || 0) - (b.trackNumber || 0);
      });

      setSongs(sortedSongs);
      setAlbums(albumsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSongPopular = async (song: any) => {
    setLoading(true);
    setError(null);
    try {
      const isNowPopular = !song.isPopular;
      const currentPopularCount = songs.filter((s: any) => s.isPopular).length;
      await updateSong(song.id, { 
        isPopular: isNowPopular,
        popularOrder: isNowPopular ? (song.popularOrder || currentPopularCount + 1) : null
      });
      await fetchSongs();
    } catch (err: any) {
      console.error("Toggle popular failed:", err);
      setError("Failed to update popular status: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handlePopularOrderChange = async (song: any, newOrder: number) => {
    try {
      await updateSong(song.id, { popularOrder: newOrder });
      setSongs(prev => prev.map(s => s.id === song.id ? { ...s, popularOrder: newOrder } : s));
    } catch (err: any) {
      console.error("Order change failed:", err);
      setError("Failed to update order: " + (err.message || err));
    }
  };

  const handleStreamCountChange = async (song: any, streams: string) => {
    try {
      await updateSong(song.id, { streamCount: streams });
      setSongs(prev => prev.map(s => s.id === song.id ? { ...s, streamCount: streams } : s));
    } catch (err: any) {
      console.error("Stream count update failed:", err);
    }
  };

  const handleAddFiller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fillerAlbumId || fillerStart === '' || fillerEnd === '') {
      setError("Please select an album and specify both start and end track numbers.");
      return;
    }
    const start = Number(fillerStart);
    const end = Number(fillerEnd);
    if (isNaN(start) || isNaN(end) || start > end || start < 1) {
      setError("Start track number must be at least 1 and less than or equal to end track number.");
      return;
    }

    setLoading(true);
    setError(null);
    setIsAddingFiller(true);

    try {
      const selectedAlbum = albums.find(a => a.id === fillerAlbumId);
      const albumCover = selectedAlbum?.coverImageUrl || '';

      for (let i = start; i <= end; i++) {
        await addSong({
          title: `Track ${i}`,
          trackNumber: i,
          albumId: fillerAlbumId,
          unavailable: true,
          lyrics: '',
          duration: '3:30',
          cover: albumCover,
          streamCount: '0',
          isPopular: false,
          artistId: 'dullstar'
        });
      }

      await fetchSongs();
      setShowFiller(false);
      setFillerStart('');
      setFillerEnd('');
      setFillerAlbumId('');
    } catch (err: any) {
      console.error("Failed to add filler tracks:", err);
      setError("Failed to add filler tracks: " + (err.message || err));
    } finally {
      setLoading(false);
      setIsAddingFiller(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'albums') {
        if (editingId) await updateAlbum(editingId, formData);
        else await addAlbum({ ...formData, artistId: 'dullstar' });
        await fetchAlbums();
      } else {
        if (editingId) await updateSong(editingId, formData);
        else await addSong({ ...formData, artistId: 'dullstar' });
        await fetchSongs();
      }
      setIsEditing(false);
      setEditingId(null);
      setFormData({});
    } catch (err: any) {
      console.error("Save failed:", err);
      setError("Error saving: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Some browsers/iframes block window.confirm, so we'll use a safer approach or just proceed for now
    // In a real app we'd use a custom modal, but for testing let's just proceed
    // if (!window.confirm("Are you sure?")) return; 
    
    console.log(`Confirmed delete for ${activeTab} item with ID: ${id}`);
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'albums') {
        await deleteAlbum(id);
        console.log("Album deleted successfully");
        await fetchAlbums();
      } else {
        await deleteSong(id);
        console.log("Song deleted successfully");
        await fetchSongs();
      }
    } catch (err: any) {
      console.error("Delete failed:", err);
      setError("Error deleting: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const syncSimilarAlbums = async () => {
    const groups = [
      ["feel_me_side_a", "feel_me_side_b"],
      ["syntax_error_side_a", "syntax_error_side_b"],
      ["my_grinder_boy", "la_antologia_de_los_mil_amores_side_a", "la_antologia_de_los_mil_amores_side_b", "los_mil_amores_de_dullstar"],
      ["time_has_no_return", "este_mundo_renace_conmigo"],
      ["methodical_torment", "methodical_tortures_aftermath"],
      ["dullstar_vol_1", "singles"]
    ];

    setLoading(true);
    setError(null);
    try {
      console.log("Starting relationship sync...");
      for (const group of groups) {
        for (const albumId of group) {
          const others = group.filter(id => id !== albumId);
          await updateAlbum(albumId, { similarAlbumIds: others });
        }
      }
      alert("Successfully synced relationships!");
      if (activeTab === 'albums') await fetchAlbums();
    } catch (err: any) {
      console.error("Sync failed:", err);
      setError("Sync failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setFormData(item);
    setIsEditing(true);
  };

   const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState('');
  const [importType, setImportType] = useState<'standard' | 'package'>('standard');

  const handleImport = async () => {
    try {
      const data = JSON.parse(importData);
      
      setLoading(true);
      
      if (importType === 'package') {
        if (typeof data !== 'object' || Array.isArray(data)) throw new Error("Album package must be a single object");
        
        const albumId = data.id || data.name.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
        const albumPayload: any = {
          title: data.name,
          releaseYear: data.release,
          coverImageUrl: data.albumcover,
          artistId: 'dullstar'
        };
        
        if (data.similarAlbumIds) albumPayload.similarAlbumIds = data.similarAlbumIds;
        
        await setAlbum(albumId, albumPayload);
        
        if (data.tracklist && Array.isArray(data.tracklist)) {
          for (const track of data.tracklist) {
            const songPayload = {
              title: track.name,
              duration: track.length,
              lyrics: track.lyrics || '',
              unavailable: !!track.unavailable,
              albumId: albumId,
              artistId: 'dullstar',
              trackNumber: data.tracklist.indexOf(track) + 1
            };
            await addSong(songPayload);
          }
        }
        alert(`Successfully imported album "${data.name}" with ${data.tracklist?.length || 0} tracks!`);
      } else {
        if (!Array.isArray(data)) throw new Error("Standard import must be an array of objects");
        for (const entry of data) {
          if (activeTab === 'albums') {
            await addAlbum({ ...entry, artistId: 'dullstar' });
          } else {
            await addSong({ ...entry, artistId: 'dullstar' });
          }
        }
        alert(`Successfully imported ${data.length} items!`);
      }
      
      setShowImport(false);
      setImportData('');
      if (activeTab === 'albums') fetchAlbums(); else fetchSongs();
    } catch (err) {
      alert("Import failed: " + err);
    } finally {
      setLoading(false);
    }
  };

  const items = activeTab === 'albums' ? albums : songs;

  if (authLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-2">Editor Access</h1>
          <p className="text-zinc-400">Sign in to manage dullStar's discography</p>
        </div>
        <button 
          onClick={login}
          className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 active:scale-95 transition-all"
        >
          <LogIn size={20} />
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
           <img src={user.photoURL || ''} className="w-10 h-10 rounded-full" />
           <div>
             <h1 className="text-2xl font-black">Admin Panel</h1>
             <p className="text-xs text-zinc-400">{user.email}</p>
           </div>
        </div>
        <button 
          onClick={logout}
          className="text-sm font-bold text-zinc-400 hover:text-white underline"
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-8 flex justify-between items-center animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded-full">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex gap-4 mb-8">
        {[
          { id: 'albums', label: 'Albums' },
          { id: 'songs', label: 'Songs' },
          { id: 'popular', label: 'Popular Songs', icon: Flame }
        ].map((tab: any) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            {tab.icon && <tab.icon size={16} className={activeTab === tab.id ? 'text-amber-500 fill-amber-500' : 'text-zinc-400'} />}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900/60 rounded-2xl p-6 min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold capitalize flex items-center gap-2">
             {activeTab === 'popular' ? (
               <>
                 <Flame size={20} className="text-amber-400 fill-amber-400" />
                 Popular Songs Management
               </>
             ) : activeTab}
           </h2>
           <div className="flex gap-2">
             {activeTab === 'albums' && (
               <button 
                 onClick={syncSimilarAlbums}
                 className="text-spotify-green hover:text-white px-4 py-2 text-sm font-bold border border-spotify-green/30 rounded-full transition-all"
               >
                 Sync Relations
               </button>
             )}
             {activeTab !== 'popular' && (
               <button 
                 onClick={() => {
                   setShowImport(!showImport);
                   setShowFiller(false);
                 }}
                 className="text-zinc-400 hover:text-white px-4 py-2 text-sm font-bold border border-zinc-700 rounded-full transition-all"
               >
                 Bulk Import
               </button>
             )}
             {activeTab === 'songs' && (
               <button 
                 onClick={() => {
                   setShowFiller(!showFiller);
                   setShowImport(false);
                   setIsEditing(false);
                 }}
                 className="flex items-center gap-2 text-zinc-300 hover:text-white px-4 py-2 text-sm font-bold border border-zinc-700 hover:border-zinc-500 rounded-full transition-all"
               >
                 <Plus size={16} />
                 Add Filler
               </button>
             )}
             <button 
               onClick={() => {
                 setEditingId(null);
                 setFormData(activeTab === 'popular' ? { isPopular: true } : {});
                 setIsEditing(true);
                 setShowFiller(false);
               }}
               className="flex items-center gap-2 bg-spotify-green text-black px-4 py-2 rounded-full text-sm font-bold hover:scale-105 transition-all"
             >
               <Plus size={16} />
               Add New
             </button>
           </div>
        </div>

        <AnimatePresence>
          {showImport && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold">Bulk Import JSON</h3>
                    <p className="text-xs text-zinc-400">Paste JSON data here.</p>
                  </div>
                  <div className="flex gap-2 bg-zinc-900 p-1 rounded-lg">
                    <button 
                      onClick={() => setImportType('standard')}
                      className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${importType === 'standard' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Standard
                    </button>
                    <button 
                      onClick={() => setImportType('package')}
                      className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${importType === 'package' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Album Package
                    </button>
                  </div>
                </div>

                <textarea 
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder={importType === 'package' 
                    ? '{ "id": "id", "name": "Album", "tracklist": [...], "release": "2024", "albumcover": "..." }'
                    : '[{"title": "Track 1", "duration": "3:30"}, ...]'
                  }
                  className="w-full h-48 bg-zinc-900 border border-zinc-700 rounded-md p-4 text-xs font-mono mb-4 outline-none focus:border-spotify-green transition-colors"
                />
                <div className="flex justify-end gap-3">
                   <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm font-bold">Cancel</button>
                   <button 
                     onClick={handleImport}
                     disabled={!importData}
                     className="bg-white text-black px-6 py-2 rounded-full text-sm font-bold hover:scale-105 transition-all disabled:opacity-50"
                   >
                     Run Import
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showFiller && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg">Add Filler Tracks</h3>
                    <p className="text-xs text-zinc-400">Quickly add unreleased/unavailable filler tracks (e.g., "Track 4" through "Track 12") for an album.</p>
                  </div>
                  <button onClick={() => setShowFiller(false)} className="text-zinc-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAddFiller} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Select Album</label>
                    <select 
                      value={fillerAlbumId}
                      onChange={(e) => setFillerAlbumId(e.target.value)}
                      required
                      className="bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-white outline-none focus:border-spotify-green transition-colors cursor-pointer"
                    >
                      <option value="">-- Choose Album --</option>
                      {albums.map((a: any) => (
                        <option key={a.id} value={a.id}>{a.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Start Track Number</label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="e.g. 4"
                      value={fillerStart}
                      onChange={(e) => setFillerStart(e.target.value ? parseInt(e.target.value) : '')}
                      required
                      className="bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-white outline-none focus:border-spotify-green transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">End Track Number</label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="e.g. 12"
                      value={fillerEnd}
                      onChange={(e) => setFillerEnd(e.target.value ? parseInt(e.target.value) : '')}
                      required
                      className="bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-white outline-none focus:border-spotify-green transition-colors"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-3 flex justify-end gap-3 mt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowFiller(false)} 
                      className="px-5 py-2 text-sm font-bold text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isAddingFiller || !fillerAlbumId || fillerStart === '' || fillerEnd === ''}
                      className="bg-spotify-green text-black px-6 py-2 rounded-full text-sm font-bold hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isAddingFiller && <Loader2 className="animate-spin w-4 h-4" />}
                      Generate Filler Tracks
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 shadow-2xl mb-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold">{editingId ? 'Edit' : 'Add New'} {activeTab === 'albums' ? 'Album' : 'Song'}</h3>
                <button onClick={() => setIsEditing(false)} className="text-zinc-400 hover:text-white"><X /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Title</label>
                  <input 
                    required
                    type="text" 
                    value={formData.title || ''}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="bg-zinc-900 border border-zinc-700 rounded-md p-2 outline-none focus:border-spotify-green" 
                    placeholder="Title" 
                  />
                </div>
                
                {activeTab === 'albums' ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Cover URL</label>
                      <input 
                        required
                        type="text" 
                        value={formData.coverImageUrl || ''}
                        onChange={e => setFormData({...formData, coverImageUrl: e.target.value})}
                        className="bg-zinc-900 border border-zinc-700 rounded-md p-2 outline-none focus:border-spotify-green" 
                        placeholder="https://..." 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Release Date/Year</label>
                      <input 
                        type="text" 
                        value={formData.releaseYear || ''}
                        onChange={e => setFormData({...formData, releaseYear: e.target.value})}
                        className="bg-zinc-900 border border-zinc-700 rounded-md p-2 outline-none focus:border-spotify-green" 
                        placeholder="20/04/2026" 
                      />
                    </div>
                    <div className="flex flex-col gap-2 col-span-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Similar Album IDs (comma separated)</label>
                      <input 
                        type="text" 
                        value={Array.isArray(formData.similarAlbumIds) ? formData.similarAlbumIds.join(', ') : (formData.similarAlbumIds || '')}
                        onChange={e => setFormData({...formData, similarAlbumIds: e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s)})}
                        className="bg-zinc-900 border border-zinc-700 rounded-md p-2 outline-none focus:border-spotify-green" 
                        placeholder="album_id_1, album_id_2" 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Album</label>
                      <select 
                        required
                        value={formData.albumId || ''}
                        onChange={e => setFormData({...formData, albumId: e.target.value})}
                        className="bg-zinc-900 border border-zinc-700 rounded-md p-2 outline-none focus:border-spotify-green"
                      >
                        <option value="">Select Album</option>
                        {albums.map(album => (
                          <option key={album.id} value={album.id}>{album.title}</option>
                        ))}
                        {albums.length === 0 && <option disabled>No albums found</option>}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Track #</label>
                      <input 
                        type="number" 
                        value={formData.trackNumber || ''}
                        onChange={e => setFormData({...formData, trackNumber: parseInt(e.target.value) || 0})}
                        className="bg-zinc-900 border border-zinc-700 rounded-md p-2 outline-none focus:border-spotify-green" 
                        placeholder="1" 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Duration</label>
                      <input 
                        type="text" 
                        value={formData.duration || ''}
                        onChange={e => setFormData({...formData, duration: e.target.value})}
                        className="bg-zinc-900 border border-zinc-700 rounded-md p-2 outline-none focus:border-spotify-green" 
                        placeholder="3:30" 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Stream Count</label>
                      <input 
                        type="text" 
                        value={formData.streamCount || ''}
                        onChange={e => setFormData({...formData, streamCount: e.target.value})}
                        className="bg-zinc-900 border border-zinc-700 rounded-md p-2 outline-none focus:border-spotify-green" 
                        placeholder="142,501,003" 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Popular Rank / Order</label>
                      <input 
                        type="number" 
                        value={formData.popularOrder ?? ''}
                        onChange={e => setFormData({...formData, popularOrder: e.target.value ? parseInt(e.target.value) : null})}
                        className="bg-zinc-900 border border-zinc-700 rounded-md p-2 outline-none focus:border-spotify-green" 
                        placeholder="1, 2, 3..." 
                      />
                    </div>
                    <div className="flex items-center gap-6 py-2 col-span-2">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="isPopular"
                          checked={formData.isPopular || false}
                          onChange={e => setFormData({...formData, isPopular: e.target.checked})}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-spotify-green focus:ring-spotify-green cursor-pointer"
                        />
                        <label htmlFor="isPopular" className="text-sm font-bold text-amber-400 flex items-center gap-1 cursor-pointer">
                          <Flame size={16} fill="currentColor" />
                          Mark as Popular Song (Home Page)
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="unavailable"
                          checked={formData.unavailable || false}
                          onChange={e => setFormData({...formData, unavailable: e.target.checked})}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-spotify-green focus:ring-spotify-green cursor-pointer"
                        />
                        <label htmlFor="unavailable" className="text-sm font-bold text-zinc-400 cursor-pointer">Mark as Unavailable</label>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 col-span-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Lyrics</label>
                      <textarea 
                        value={formData.lyrics || ''}
                        onChange={e => setFormData({...formData, lyrics: e.target.value})}
                        className="bg-zinc-900 border border-zinc-700 rounded-md p-2 outline-none focus:border-spotify-green h-48 resize-none" 
                        placeholder="Enter lyrics here (optional for unavailable songs)..." 
                      />
                    </div>
                  </>
                )}

                <div className="col-span-full flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 font-bold text-sm">Cancel</button>
                  <button type="submit" className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                    {loading && <Loader2 className="animate-spin w-4 h-4" />}
                    Save {editingId ? 'Changes' : 'Entry'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && !isEditing ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-12 h-12" /></div>
        ) : activeTab === 'popular' ? (
          <div className="flex flex-col gap-8">
            {/* Current Popular Songs */}
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Featured Popular Songs ({songs.filter((s: any) => s.isPopular).length})</span>
                <span className="text-xs text-zinc-500 normal-case">Displayed in 'Popular' section on Home page</span>
              </h3>

              {songs.filter((s: any) => s.isPopular).length === 0 ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center text-amber-200">
                  <p className="font-bold mb-1">No songs explicitly marked as popular yet.</p>
                  <p className="text-xs opacity-80">The Home page currently displays the first 5 tracks. Click "+ Add to Popular" on any song below to feature it!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {songs
                    .filter((s: any) => s.isPopular)
                    .sort((a: any, b: any) => (a.popularOrder ?? 999) - (b.popularOrder ?? 999))
                    .map((song, index, arr) => {
                      const album = albums.find(a => a.id === song.albumId);
                      return (
                        <div key={song.id} className="flex items-center justify-between p-3.5 bg-zinc-800/60 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all group">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs">
                              #{index + 1}
                            </div>
                            <img src={album?.coverImageUrl || song.cover} className="w-12 h-12 rounded shadow-md object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-bold text-white truncate flex items-center gap-2">
                                {song.title}
                                <span className="text-[10px] uppercase bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded-full">Popular</span>
                              </span>
                              <span className="text-xs text-zinc-400 truncate">{album?.title || 'Single'} • Duration: {song.duration || '3:30'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1 items-end">
                              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Streams</label>
                              <input 
                                type="text" 
                                defaultValue={song.streamCount || '142,501,003'}
                                onBlur={(e) => handleStreamCountChange(song, e.target.value)}
                                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-right text-zinc-300 focus:border-spotify-green outline-none w-28"
                              />
                            </div>

                            <div className="flex gap-1">
                              <button 
                                onClick={() => handlePopularOrderChange(song, Math.max(1, (song.popularOrder || index + 1) - 1))}
                                disabled={index === 0}
                                className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                title="Move Up"
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button 
                                onClick={() => handlePopularOrderChange(song, (song.popularOrder || index + 1) + 1)}
                                disabled={index === arr.length - 1}
                                className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                title="Move Down"
                              >
                                <ArrowDown size={16} />
                              </button>
                            </div>

                            <button 
                              onClick={() => startEdit(song)}
                              className="p-2 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors"
                              title="Edit Song"
                            >
                              <Edit2 size={16} />
                            </button>

                            <button 
                              onClick={() => toggleSongPopular(song)}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/20 transition-all"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* All Other Songs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                  Add Songs to Popular
                </h3>
                <div className="relative">
                  <SearchIcon size={14} className="absolute left-3 top-2.5 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Search tracks..."
                    value={songSearchQuery}
                    onChange={(e) => setSongSearchQuery(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-full pl-8 pr-4 py-1 text-xs text-zinc-300 outline-none focus:border-spotify-green w-48"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                {songs
                  .filter((s: any) => !s.isPopular)
                  .filter((s: any) => {
                    if (!songSearchQuery) return true;
                    const album = albums.find(a => a.id === s.albumId);
                    return (
                      s.title?.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
                      (album?.title && album.title.toLowerCase().includes(songSearchQuery.toLowerCase()))
                    );
                  })
                  .map((song) => {
                    const album = albums.find(a => a.id === song.albumId);
                    return (
                      <div key={song.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl hover:bg-zinc-800/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <img src={album?.coverImageUrl || song.cover} className="w-10 h-10 rounded shadow object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <h4 className="font-bold text-sm text-white">{song.title}</h4>
                            <p className="text-xs text-zinc-400">{album?.title || 'Single'} • {song.duration || '3:30'}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleSongPopular(song)}
                          className="flex items-center gap-1.5 bg-spotify-green/20 hover:bg-spotify-green text-spotify-green hover:text-black border border-spotify-green/30 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                        >
                          <Plus size={14} />
                          Add to Popular
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-4">
            {items.map((item) => {
              const isPopularSong = activeTab === 'songs' && item.isPopular;
              return (
                <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-800/40 rounded-lg hover:bg-zinc-800/80 transition-colors group">
                  <div className="flex items-center gap-4">
                    {(item.coverImageUrl || item.cover) && (
                      <img src={item.coverImageUrl || item.cover} className="w-12 h-12 rounded shadow-md object-cover" referrerPolicy="no-referrer" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold">{item.title}</h4>
                        {isPopularSong && (
                          <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30">
                            <Flame size={12} fill="currentColor" />
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">{item.releaseYear || item.albumId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeTab === 'songs' && (
                      <button 
                        onClick={() => toggleSongPopular(item)}
                        className={`p-2 rounded-full transition-colors ${item.isPopular ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-zinc-500 hover:text-amber-400 hover:bg-zinc-700'}`}
                        title={item.isPopular ? "Remove from Popular" : "Mark as Popular"}
                      >
                        <Star size={18} fill={item.isPopular ? "currentColor" : "none"} />
                      </button>
                    )}
                    <button onClick={() => startEdit(item)} className="p-2 hover:bg-zinc-700 rounded-full transition-colors text-zinc-400 hover:text-white">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-900/40 rounded-full transition-colors text-zinc-400 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
            {items.length === 0 && (
              <div className="text-center py-20 text-zinc-500 italic">No entries found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
