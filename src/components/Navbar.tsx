import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Search, Bell, PenSquare, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';


export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch('http://localhost:3000/api/notifications', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('forum_token')}` }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`http://localhost:3000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('forum_token')}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">&lt;/&gt;</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">DevEd</span>
          </Link>
          
          <div className="flex-1 max-w-2xl px-8 hidden md:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                type="text" 
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all sm:text-sm" 
                placeholder="Search discussions, tags, or people..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="text-slate-500 hover:text-blue-600 transition-colors relative p-1"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.postId) navigate(`/post/${n.postId}`);
                                setShowNotifications(false);
                              }}
                              className={`p-4 flex gap-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                            >
                              <img src={n.actorAvatar} className="h-10 w-10 rounded-full border border-slate-100 object-cover" alt="" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-900 leading-snug">
                                  <span className="font-bold">{n.actorName}</span>{' '}
                                  {n.type === 'follow' ? 'started following you' : 'commented on your post'}
                                </p>
                                {n.postTitle && <p className="text-xs text-slate-500 truncate mt-1">"{n.postTitle}"</p>}
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {formatDistanceToNow(new Date(n.createdAt + 'Z'), { addSuffix: true })}
                                </p>
                              </div>
                              {!n.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full self-center" />}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <Link to="/my-profile" className="h-8 w-8 rounded-full border-2 border-slate-200 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors">
                  <img src={user.avatar} alt={user.username} className="h-full w-full object-cover" />
                </Link>
                <button 
                  onClick={() => {
                    const event = new CustomEvent('openNewPostModal');
                    window.dispatchEvent(event);
                  }}
                  className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm items-center gap-2 transition-colors shadow-sm shadow-blue-600/20"
                >
                  <PenSquare className="h-4 w-4" />
                  New Post
                </button>
                <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 transition-colors ml-2">
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                  <LogIn className="h-4 w-4" /> Login
                </Link>
                <Link to="/register" className="flex bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm items-center gap-2 transition-colors">
                  <UserPlus className="h-4 w-4" /> Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
