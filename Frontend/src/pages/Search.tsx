import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { PostCard } from '../components/PostCard';
import { Search as SearchIcon, Users, ArrowLeft } from 'lucide-react';
import { UserHoverCard } from '../components/UserHoverCard';
import { DomainSelect } from '../components/DomainSelect';
import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';

export const Search = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('q') || '';
  const initialDomain = new URLSearchParams(location.search).get('domain') || '';
  const initialStatus = new URLSearchParams(location.search).get('status') || '';
  const searchType = new URLSearchParams(location.search).get('type') || 'posts';
  
  const parsedInitialDomain = (() => {
    try {
      const d = JSON.parse(initialDomain);
      if (Array.isArray(d)) return d;
    } catch(e) {}
    return initialDomain ? [initialDomain] : [];
  })();
  
  const [domain, setDomain] = useState<string[]>(parsedInitialDomain);
  const [status, setStatus] = useState(initialStatus);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync state with URL when it changes
  useEffect(() => {
    setDomain(parsedInitialDomain);
    setStatus(initialStatus);
  }, [location.search]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim() && domain.length === 0) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`http://localhost:3000/api/posts/search?q=${encodeURIComponent(query)}&domain=${encodeURIComponent(domain.length > 0 ? JSON.stringify(domain) : "")}&status=${encodeURIComponent(status)}&type=${encodeURIComponent(searchType)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        } else {
          setError('Failed to fetch results');
        }
      } catch (e) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, domain, status, searchType]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
      <Sidebar />
      <div className="flex-1 py-6 lg:px-8 min-w-0">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-4 group text-sm font-medium">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to feed
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-end gap-3">
            <div className="p-3 bg-blue-100 rounded-2xl">
              <SearchIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">Search Results</h1>
              <p className="text-slate-500 text-sm mt-1">
                {query ? (
                  <>Showing results for <span className="text-blue-600 font-bold">"{query}"</span> {domain.length > 0 && `in ${domain.join(', ')}`} {status && `(${status})`}</>
                ) : (
                  <>Browsing {domain.length > 0 ? `in ${domain.join(', ')}` : 'All Posts'} {status && `(${status})`}</>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex bg-white p-3 rounded-2xl border border-slate-200 shadow-sm gap-4 items-end flex-wrap w-full sm:w-auto mt-4 sm:mt-0">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                Domain Filter
              </label>
              <DomainSelect 
                value={domain} 
                onChange={setDomain} 
                placeholder="All Domains" 
                className="py-2.5 text-sm font-semibold rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
            {query && !query.startsWith('@') && searchType !== 'users' && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Status
                </label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 bg-slate-50 text-sm font-semibold pr-10 appearance-none"
                >
                  <option value="">All Status</option>
                  <option value="answered">Answered</option>
                  <option value="unanswered">Unanswered</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Searching the forum...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 text-center">
          {error}
        </div>
      ) : results ? (
        <div className="space-y-6">
          {results.results.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-900 font-bold text-lg">No results found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your keywords or prefixes (@ for users, # for tags)</p>
            </div>
          ) : results.type === 'users' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.results.map((user: any) => (
                <div key={user.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow group">
                  <UserHoverCard userId={user.id}>
                    <img src={user.avatar} className="h-14 w-14 rounded-full border border-slate-100 object-cover" alt="" />
                  </UserHoverCard>
                  <div className="flex-1 min-w-0">
                    <UserHoverCard userId={user.id}>
                      <h3 className="font-bold text-slate-900 truncate hover:text-blue-600 transition-colors uppercase cursor-pointer">{user.username}</h3>
                    </UserHoverCard>
                    <p className="text-xs text-slate-500 mt-0.5 font-semibold flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {user.points} Points
                    </p>
                    {user.description && (
                      <p className="text-[11px] text-slate-600 line-clamp-1 mt-1 leading-relaxed">
                        {user.description}
                      </p>
                    )}
                  </div>
                  <Link 
                    to={`/user/${user.id}`}
                    className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 rotate-180" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {results.results.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      ) : !query && (
         <div className="text-center py-20">
            <p className="text-slate-400 italic">Enter a search query in the navbar above.</p>
         </div>
      )}
      </div>
      <RightSidebar />
    </main>
  );
};
