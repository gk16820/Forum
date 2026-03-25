import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';
import { useAuth } from '../context/AuthContext';
import { Bell, Heart, MessageSquare, UserPlus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { API_BASE_URL } from '../config';


export const Notifications = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setNotifications(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [token]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'upvote': return <Heart className="h-5 w-5 text-red-500 fill-current" />;
      case 'comment': return <MessageSquare className="h-5 w-5 text-green-600" />;
      case 'follow': return <UserPlus className="h-5 w-5 text-blue-600" />;
      default: return <Bell className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex bg-white min-h-screen">
      <Sidebar />
      <div className="flex-1 py-10 lg:px-12 min-w-0">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            {notifications.length} Total
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 animate-pulse">
            <div className="w-10 h-10 border-4 border-green-600/10 border-t-green-600 rounded-full animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading history...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-slate-50/50 p-20 rounded-[2.5rem] border border-slate-100 text-center">
            <div className="text-5xl mb-6">🔕</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No notifications yet</h2>
            <p className="text-slate-500 max-w-sm mx-auto">We'll let you know when someone interacts with your activity or follows you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`flex gap-4 p-5 rounded-2xl border transition-all ${notif.read ? 'bg-white border-slate-100' : 'bg-green-50/30 border-green-100 shadow-sm'}`}
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-100">
                    {getIcon(notif.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 leading-relaxed font-medium">
                    <span className="font-extrabold text-slate-900">{notif.actorName}</span>{' '}
                    {notif.content}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2 flex items-center gap-2">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    {!notif.read && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
                  </p>
                </div>

                {notif.postId && (
                  <Link 
                    to={`/post/${notif.postId}`}
                    className="flex-shrink-0 self-center p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-green-600 transition-all border border-transparent hover:border-slate-200"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <RightSidebar />
    </main>
  );
};
