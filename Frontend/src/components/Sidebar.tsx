import { useState, useEffect } from 'react';
import { Home, TrendingUp, Hash, Bookmark, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';


export const Sidebar = () => {
  const [trending, setTrending] = useState<{tag: string, count: number}[]>([]);
  const location = useLocation();

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/posts/trending`)
      .then(res => res.json())
      .then(data => setTrending(Array.isArray(data) ? data : []))
      .catch(e => { console.error(e); setTrending([]); });
  }, []);

  const navItems = [
    { name: 'Home', icon: Home, to: '/' },
    { name: 'Trending', icon: TrendingUp, to: '/trending' },
    { name: 'Tags', icon: Hash, to: '/tags' },
    { name: 'Bookmarks', icon: Bookmark, to: '/bookmarks' },
    { name: 'Communities', icon: Users, to: '/communities' },
  ];

  return (
    <>
      {/* Desktop/Tablet Sidebar */}
      <aside className="hidden md:block w-52 lg:w-64 pr-4 lg:pr-8 py-6 sticky top-16 h-[calc(100vh-4rem)] flex-shrink-0">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isCurrent = location.pathname === item.to;
            return (
              <Link
                key={item.name}
                to={item.to}
                className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                  isCurrent 
                    ? 'bg-slate-100 text-brand-700 shadow-sm shadow-slate-200/50' 
                    : 'text-secondary hover:bg-slate-50 hover:text-primary border border-transparent'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 transition-colors ${isCurrent ? 'text-brand-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="h-px bg-slate-200 my-8 mx-4 opacity-70"></div>

        <div className="mt-2">
          <h3 className="px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-4">
            Trending Topics
          </h3>
          <div className="space-y-1 px-1">
            {(!Array.isArray(trending) || trending.length === 0) ? (
              <p className="px-4 text-xs text-slate-400 italic">No topics yet.</p>
            ) : trending.map(t => (
              <Link key={t.tag} to={`/search?domain=${encodeURIComponent(t.tag)}`} className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-700 hover:bg-slate-50 rounded-xl transition-all group">
                <span className="group-hover:translate-x-1 transition-transform">#{t.tag}</span>
                <span className="text-[10px] bg-slate-100/50 text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-700 px-2 py-0.5 rounded-full font-bold transition-colors">{t.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex justify-around items-center h-16 px-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {navItems.map((item) => {
          const isCurrent = location.pathname === item.to;
          return (
            <Link
              key={item.name}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all ${
                isCurrent ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
