import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';


interface Community {
  id: number;
  name: string;
  description: string;
  creatorName: string;
  isMember: boolean;
  createdAt: string;
}

export const Communities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [error, setError] = useState('');
  const { user, token } = useAuth();

  const fetchCommunities = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/api/communities`, { headers });
      if (res.ok) {
        setCommunities(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDesc.trim()) return;
    setError('');
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/communities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName, description: newDesc })
      });
      const data = await res.json();
      if (res.ok) {
        setNewName('');
        setNewDesc('');
        setIsCreating(false);
        fetchCommunities();
      } else {
        setError(data.error || 'Failed to create');
      }
    } catch (e) {
      setError('Network error');
    }
  };



  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
      <Sidebar />
      <div className="flex-1 py-6 lg:px-8 min-w-0">
        <div className="flexjustify-between items-center mb-6">
          <div className="flex justify-between w-full items-center">
             <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Communities</h1>
             {user?.userType === 'guvi faculty' && (
               <button
                 onClick={() => setIsCreating(!isCreating)}
                 className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
               >
                 {isCreating ? 'Cancel' : 'Create Community'}
               </button>
             )}
          </div>
        </div>

        {isCreating && user?.userType === 'guvi faculty' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 animate-in slide-in-from-top-4 duration-200">
            <h2 className="text-lg font-bold mb-4">Create a New Community</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. React Developers"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="What is this community about?"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition"
              >
                Create
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white h-24 rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-4xl mb-4">🌍</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No communities yet</h2>
            <p className="text-slate-500">Wait for GUVI faculties to create some!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communities.map(community => (
              <Link to={`/community/${community.id}`} key={community.id} className="block">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition h-full">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{community.name}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{community.description}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Created by {community.creatorName}</span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">{community.isMember ? 'Joined' : 'Open'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <RightSidebar />
    </main>
  );
};
