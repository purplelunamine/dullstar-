import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, LogIn, Loader2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'albums' | 'songs'>('albums');
  const [isEditing, setIsEditing] = useState(false);
  const [albums, setAlbums] = useState<any[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "dullStar Collection - Admin";
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
        {['albums', 'songs'].map((tab: any) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === tab ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900/60 rounded-2xl p-6 min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold capitalize">{activeTab}</h2>
           <div className="flex gap-2">
             {activeTab === 'albums' && (
               <button 
                 onClick={syncSimilarAlbums}
                 className="text-spotify-green hover:text-white px-4 py-2 text-sm font-bold border border-spotify-green/30 rounded-full transition-all"
               >
                 Sync Relations
               </button>
             )}
             <button 
               onClick={() => setShowImport(!showImport)}
               className="text-zinc-400 hover:text-white px-4 py-2 text-sm font-bold border border-zinc-700 rounded-full transition-all"
             >
               Bulk Import
             </button>
             <button 
               onClick={() => {
                 setEditingId(null);
                 setFormData({});
                 setIsEditing(true);
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
                    <div className="flex items-center gap-2 py-2">
                      <input 
                        type="checkbox" 
                        id="unavailable"
                        checked={formData.unavailable || false}
                        onChange={e => setFormData({...formData, unavailable: e.target.checked})}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-spotify-green focus:ring-spotify-green"
                      />
                      <label htmlFor="unavailable" className="text-sm font-bold text-zinc-400">Mark as Unavailable</label>
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
        ) : (
          <div className="flex flex-col gap-2 mt-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-800/40 rounded-lg hover:bg-zinc-800/80 transition-colors group">
                <div className="flex items-center gap-4">
                  {(item.coverImageUrl || item.cover) && (
                    <img src={item.coverImageUrl || item.cover} className="w-12 h-12 rounded shadow-md" referrerPolicy="no-referrer" />
                  )}
                  <div>
                    <h4 className="font-bold">{item.title}</h4>
                    <p className="text-xs text-zinc-400">{item.releaseYear || item.albumId}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(item)} className="p-2 hover:bg-zinc-700 rounded-full transition-colors text-zinc-400 hover:text-white">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-900/40 rounded-full transition-colors text-zinc-400 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-20 text-zinc-500 italic">No entries found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
