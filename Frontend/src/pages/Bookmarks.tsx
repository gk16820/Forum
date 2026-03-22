import { Sidebar } from '../components/Sidebar';
import { Check } from 'lucide-react';
import { RightSidebar } from '../components/RightSidebar';
import { PostCard } from '../components/PostCard';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const Bookmarks = () => {
  const { token } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [lists, setLists] = useState<string[]>(['All', 'General']);
  
  // Custom Modal State for Rename
  const [modalOpen, setModalOpen] = useState(false);

  const [modalInput, setModalInput] = useState('');
  const [targetList, setTargetList] = useState('');
  
  // Inline Creation State
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListInput, setNewListInput] = useState('');

  useEffect(() => {
    if (!token) return;
    const fetchBookmarks = async () => {
      try {
        const [res, listsRes] = await Promise.all([
          fetch('http://localhost:3000/api/bookmarks', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:3000/api/bookmarks/lists', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (res.ok) setPosts(await res.json());
        if (listsRes.ok) {
          const lData = await listsRes.json();
          setLists(['All', ...lData]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [token]);

  const handleCreateInline = async () => {
    if (!newListInput.trim()) {
      setIsCreatingList(false);
      return;
    }
    const name = newListInput.trim();
    try {
      const res = await fetch('http://localhost:3000/api/bookmarks/lists', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        setLists(prev => [...prev, name]);
        setActiveCategory(name);
        setNewListInput('');
        setIsCreatingList(false);
      }
    } catch(e) {
      alert("Failed to save list.");
    }
  };

  const openRenameModal = (oldName: string) => {
    if (oldName === 'All' || oldName === 'General') {
       alert("Cannot rename default lists.");
       return;
    }
    setTargetList(oldName);
    setModalInput(oldName);
    setModalOpen(true);
  };

  const handleModalSubmit = async () => {
    if (!modalInput.trim()) return;
    const newName = modalInput.trim();
    try {
      await fetch('http://localhost:3000/api/bookmarks/lists', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName: targetList, newName })
      });
      setLists(prev => prev.map(l => l === targetList ? newName : l));
      if (activeCategory === targetList) setActiveCategory(newName);
      setPosts(prev => prev.map(p => p.bookmarkCategory === targetList ? { ...p, bookmarkCategory: newName } : p));
      setModalOpen(false);
    } catch(e) {
      alert("Failed to save list.");
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex bg-white min-h-screen">
      <Sidebar />
      <div className="flex-1 py-10 lg:px-12 min-w-0">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Your Bookmarks</h1>
        {!loading && (
          <div className="flex gap-3 mb-8 overflow-x-auto pb-4 items-center no-scrollbar">
            {lists.map(cat => (
              <div key={cat} className="flex items-center gap-1 group">
                <button
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2.5 font-bold text-sm rounded-xl transition-all whitespace-nowrap border-2 ${
                    activeCategory === cat 
                      ? 'bg-navy-blue border-navy-blue text-white shadow-lg shadow-navy-blue/20' 
                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
                {activeCategory === cat && cat !== 'All' && cat !== 'General' && (
                  <button onClick={() => openRenameModal(cat)} className="text-slate-300 hover:text-green-600 p-2 transition-colors" title="Rename List">
                    <span className="text-base font-bold">✎</span>
                  </button>
                )}
              </div>
            ))}
            {isCreatingList ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  autoFocus
                  value={newListInput}
                  onChange={e => setNewListInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateInline();
                    if (e.key === 'Escape') setIsCreatingList(false);
                  }}
                  placeholder="List name..."
                  className="px-6 py-2 font-bold text-sm rounded-xl bg-slate-50 border-2 border-navy-blue focus:outline-none focus:ring-4 focus:ring-navy-blue/10 w-44 shadow-sm animate-in zoom-in-95 duration-200"
                />
                <button 
                  onClick={handleCreateInline}
                  className="p-2 bg-navy-blue text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                  title="Save List"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsCreatingList(true)}
                className="px-4 py-2 font-bold text-lg rounded-xl bg-slate-50 text-slate-400 hover:bg-green-50 hover:text-green-600 transition-all border-2 border-dashed border-slate-200 hover:border-green-200 flex items-center justify-center min-w-[50px] aspect-square"
                title="Create new list"
              >
                +
              </button>
            )}
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 animate-pulse">
            <div className="w-12 h-12 border-4 border-green-600/10 border-t-green-600 rounded-full animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching your workspace...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-slate-50/50 p-20 rounded-[3rem] border border-slate-100 shadow-sm text-center">
            <div className="text-6xl mb-6">📂</div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">No bookmarks in this view</h2>
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">Organize your thought process by bookmarking interesting discussions and categorizing them.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts
              .filter(post => activeCategory === 'All' || post.bookmarkCategory === activeCategory)
              .map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}

      </div>
      <RightSidebar />
      
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight text-center">
              Rename List
            </h3>
            <p className="text-sm text-slate-500 mb-8 text-center font-medium">Changing the name will update it for all bookmarks in this list.</p>
            
            <input 
              type="text"
              autoFocus
              value={modalInput}
              onChange={e => setModalInput(e.target.value)}
              className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl mb-8 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 bg-slate-50 text-lg font-bold transition-all"
              onKeyDown={e => e.key === 'Enter' && handleModalSubmit()}
            />
            
            <div className="flex gap-4">
              <button 
                onClick={() => setModalOpen(false)}
                className="flex-1 px-8 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleModalSubmit}
                 className="flex-1 px-8 py-4 font-bold bg-green-600 text-white hover:bg-green-700 shadow-xl shadow-green-500/20 rounded-2xl transition-all active:scale-95"
               >
                 Apply Changes
               </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

