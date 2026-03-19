import { useState, useEffect } from 'react';
import { Home, TrendingUp, Hash, Bookmark, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Sidebar = () => {
  const [trending, setTrending] = useState<{tag: string, count: number}[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/trending')
      .then(res => res.json())
      .then(data => setTrending(data))
      .catch(console.error);
  }, []);

  return (
    <aside className="hidden lg:block w-64 pr-8 py-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <nav className="space-y-1">
        {[
          { name: 'Home', icon: Home, current: true, to: '/' },
          { name: 'Trending', icon: TrendingUp, current: false, to: '/' },
          { name: 'Tags', icon: Hash, current: false, to: '/' },
          { name: 'Bookmarks', icon: Bookmark, current: false, to: '/' },
          { name: 'Communities', icon: Users, current: false, to: '/' },
        ].map((item) => (
          <Link
            key={item.name}
            to={item.to}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
              item.current 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon className={`mr-3 h-5 w-5 ${item.current ? 'text-blue-600' : 'text-slate-400'}`} />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="mt-10">
        <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Trending Topics
        </h3>
        <div className="space-y-2">
          {trending.length === 0 ? (
            <p className="px-4 text-sm text-slate-500 italic">No topics yet.</p>
          ) : trending.map(t => (
            <Link key={t.tag} to="/" className="flex items-center justify-between px-4 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors">
              <span>{t.tag}</span>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{t.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
};
