import { useState, useEffect } from 'react';
import { Home, TrendingUp, Hash, Bookmark, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar = () => {
  const [trending, setTrending] = useState<{tag: string, count: number}[]>([]);
  const location = useLocation();

  useEffect(() => {
    fetch('http://localhost:3000/api/trending')
      .then(res => res.json())
      .then(data => setTrending(data))
      .catch(console.error);
  }, []);

  const navItems = [
    { name: 'Home', icon: Home, to: '/' },
    { name: 'Trending', icon: TrendingUp, to: '/trending' },
    { name: 'Tags', icon: Hash, to: '/tags' },
    { name: 'Bookmarks', icon: Bookmark, to: '/bookmarks' },
    { name: 'Communities', icon: Users, to: '/communities' },
  ];

  return (
    <aside className="hidden lg:block w-64 pr-8 py-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isCurrent = location.pathname === item.to;
          return (
            <Link
              key={item.name}
              to={item.to}
              className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                isCurrent 
                  ? 'bg-slate-100 text-green-700 shadow-sm shadow-slate-200/50' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <item.icon className={`mr-3 h-5 w-5 transition-colors ${isCurrent ? 'text-green-600' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-10">
        <h3 className="px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-4">
          Trending Topics
        </h3>
        <div className="space-y-1 px-1">
          {trending.length === 0 ? (
            <p className="px-4 text-xs text-slate-400 italic">No topics yet.</p>
          ) : trending.map(t => (
            <Link key={t.tag} to="/tags" className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 hover:text-green-700 hover:bg-slate-50 rounded-xl transition-all group">
              <span className="group-hover:translate-x-1 transition-transform">#{t.tag}</span>
              <span className="text-[10px] bg-slate-100/50 text-slate-400 group-hover:bg-green-100 group-hover:text-green-700 px-2 py-0.5 rounded-full font-bold transition-colors">{t.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
};
