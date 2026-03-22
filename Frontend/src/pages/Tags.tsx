import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';
import { Hash } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Tags = () => {
  const [tags, setTags] = useState<{tag: string, count: number}[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/posts/trending');
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        const data = await response.json();
        setTags(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error("Fetch error:", e);
        setError(e.message || "Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
      <Sidebar />
      <div className="flex-1 py-6 lg:px-8 min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Discover Tags</h1>
        <p className="text-slate-500 mb-8">Browse the most popular topics discussed across the forum.</p>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Loading tags...</p>
          </div>
        ) : error ? (
           <div className="bg-white p-12 rounded-2xl border border-red-100 shadow-sm text-center">
            <div className="text-4xl mb-4 text-red-500">📵</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Error</h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-500/20"
            >
              Try Refreshing
            </button>
          </div>
        ) : tags.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-4xl mb-4">🏷️</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No tags yet</h2>
            <p className="text-slate-500">Tags will appear here once questions are posted.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tags.map(t => (
              <Link key={t.tag} to={`/search?domain=${encodeURIComponent(t.tag)}`} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-600 transition-all group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Hash className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg truncate">
                    {t.tag}
                  </h3>
                </div>
                <div className="text-sm text-slate-500 font-medium">
                  {t.count} {t.count === 1 ? 'question' : 'questions'}
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
