import { Sidebar } from '../components/Sidebar';
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
    try {
      await fetch('http://localhost:3000/api/bookmarks/lists', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListInput.trim() })
      });
      window.location.reload();
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
    try {
      await fetch('http://localhost:3000/api/bookmarks/lists', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName: targetList, newName: modalInput.trim() })
      });
      setModalOpen(false);
      window.location.reload();
    } catch(e) {
      alert("Failed to save list.");
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
      <Sidebar />
      <div className="flex-1 py-6 lg:px-8 min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Your Bookmarks</h1>
        {!loading && (
          <div className="flex gap-4 mb-6 overflow-x-auto pb-2 border-b border-slate-100 items-center">
            {lists.map(cat => (
              <div key={cat} className="flex items-center gap-1 group">
                <button
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 font-bold text-sm rounded-full transition-colors whitespace-nowrap ${
                    activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
                {activeCategory === cat && cat !== 'All' && cat !== 'General' && (
                  <button onClick={() => openRenameModal(cat)} className="text-slate-400 hover:text-blue-600 p-1" title="Rename List">
                    <span className="text-xs font-bold">✎</span>
                  </button>
                )}
              </div>
            ))}
            {isCreatingList ? (
              <input 
                type="text"
                autoFocus
                value={newListInput}
                onChange={e => setNewListInput(e.target.value)}
                onBlur={handleCreateInline}
                onKeyDown={e => e.key === 'Enter' && handleCreateInline()}
                placeholder="List name..."
                className="px-4 py-2 font-bold text-sm rounded-full bg-white border-2 border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 shadow-sm"
              />
            ) : (
              <button 
                onClick={() => setIsCreatingList(true)}
                className="px-3 py-2 font-bold text-sm rounded-full bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-center border border-slate-200"
                title="Create new list"
              >
                +
              </button>
            )}
          </div>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Loading bookmarks...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-4xl mb-4">🔖</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">You haven't bookmarked any posts yet</h2>
            <p className="text-slate-500">Click the bookmark icon on any interesting discussion to save it here for later.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts
              .filter(post => activeCategory === 'All' || post.bookmarkCategory === activeCategory)
              .map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}

      </div>
      <RightSidebar />
      
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">
              Rename List
            </h3>
            <input 
              type="text"
              autoFocus
              value={modalInput}
              onChange={e => setModalInput(e.target.value)}
              placeholder="List name..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 focus:bg-white"
              onKeyDown={e => e.key === 'Enter' && handleModalSubmit()}
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleModalSubmit}
                 className="px-5 py-2.5 font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 rounded-xl transition-colors"
               >
                 Save changes
               </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

