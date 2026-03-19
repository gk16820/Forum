import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, PenSquare, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button className="text-slate-500 hover:text-blue-600 transition-colors relative hidden sm:block">
                  <Bell className="h-5 w-5" />
                </button>
                <Link to="/profile" className="h-8 w-8 rounded-full border-2 border-slate-200 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors">
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
