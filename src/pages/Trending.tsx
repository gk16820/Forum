import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';
import { PostCard } from '../components/PostCard';
import { useAuth } from '../context/AuthContext';

export const Trending = () => {
  const { token } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('http://localhost:3000/api/posts?sort=popular', { headers });
        if (res.ok) setPosts(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, [token]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
      <Sidebar />
      <div className="flex-1 py-6 lg:px-8 min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Trending Discussions</h1>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Loading trending...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-4xl mb-4">🔥</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No trending discussions yet</h2>
            <p className="text-slate-500">Check back later when there's more activity.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </div>
      <RightSidebar />
    </main>
  );
};
