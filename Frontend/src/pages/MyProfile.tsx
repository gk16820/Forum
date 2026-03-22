import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Calendar, Heart, Briefcase, Globe, MessageSquare, PenSquare, Settings, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { PostCard } from '../components/PostCard';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';

export const MyProfile = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('About');
  const [activityTab, setActivityTab] = useState('Upvotes');
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myUpvotes, setMyUpvotes] = useState<any[]>([]);
  const [myReplies, setMyReplies] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [modalType, setModalType] = useState<'Followers' | 'Following' | null>(null);
  const [modalData, setModalData] = useState<any[]>([]);

  const fetchModalData = async (type: 'Followers' | 'Following') => {
    setModalType(type);
    setModalData([]); // Loading state
    try {
      const endpoint = type === 'Followers' ? '/api/users/me/followers' : '/api/users/me/following';
      const res = await fetch(`http://localhost:3000${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setModalData(await res.json());
    } catch(e) { setModalData([]); }
  };

  useEffect(() => {
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    fetch('http://localhost:3000/api/users/me/posts', { headers })
      .then(r => r.ok ? r.json() : []).then(setMyPosts).catch(() => {});
    fetch('http://localhost:3000/api/users/me/upvotes', { headers })
      .then(r => r.ok ? r.json() : []).then(setMyUpvotes).catch(() => {});
    fetch('http://localhost:3000/api/users/me/replies', { headers })
      .then(r => r.ok ? r.json() : []).then(setMyReplies).catch(() => {});

    if (user?.id) {
      fetch(`http://localhost:3000/api/users/${user.id}`, { headers })
        .then(r => r.ok ? r.json() : null).then(setProfile).catch(() => {});
    }
  }, [token, user?.id]);

  if (!user) return <div className="text-center py-20">Please login first.</div>;

  const joinedDate = profile?.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : 'Joined Mar 2026';

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex bg-white min-h-screen">
      <Sidebar />
      <div className="flex-1 py-10 lg:px-12 min-w-0">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
          <button
            onClick={() => navigate('/my-profile/edit')}
            title="Edit Profile"
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-accent-600 group"
          >
            <Pencil className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="max-w-4xl">
          {/* Hero Section */}
          <div className="flex flex-col md:flex-row items-start gap-8 mb-10">
            <div className="relative">
              <img
                src={user.avatar}
                className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-white shadow-xl object-cover"
                alt={user.username}
              />
              <div className="absolute bottom-4 right-4 w-6 h-6 bg-accent-500 border-4 border-white rounded-full"></div>
            </div>

            <div className="flex-1 pt-4">
              <div className="mb-4">
                <h2 className="text-4xl font-extrabold text-slate-900 mb-1 tracking-tight">
                  {user.username}
                </h2>
                {(user.role || user.domain) && (
                  <p className="text-lg text-slate-500 font-medium">
                    {[user.role, user.domain].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>

              <p className="text-slate-600 text-base leading-relaxed max-w-2xl mb-8">
                {user.description || (
                  <span className="italic text-slate-400">
                    No description yet. <button onClick={() => navigate('/my-profile/edit')} className="text-accent-600 underline">Add one</button>
                  </span>
                )}
              </p>

              {profile && (
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <button 
                    onClick={() => fetchModalData('Followers')}
                    className="bg-accent-50 px-8 py-3 rounded-2xl border border-accent-100 min-w-[140px] text-left hover:bg-accent-100 transition-colors group"
                  >
                    <p className="text-2xl font-bold text-slate-900 group-hover:text-accent-600 transition-colors">{profile.expectedFollowers || 0}</p>
                    <p className="text-slate-500 font-medium text-sm">Followers</p>
                  </button>
                  <button 
                    onClick={() => fetchModalData('Following')}
                    className="bg-accent-50 px-8 py-3 rounded-2xl border border-accent-100 min-w-[140px] text-left hover:bg-accent-100 transition-colors group"
                  >
                    <p className="text-2xl font-bold text-slate-900 group-hover:text-accent-600 transition-colors">{profile.expectedFollowing || 0}</p>
                    <p className="text-slate-500 font-medium text-sm">Following</p>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-6 mt-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Points: <span className="text-accent-600 ml-1 font-extrabold">{profile?.points ?? user.points ?? 0}</span></p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-100 mb-8">
            <div className="flex gap-8 overflow-x-auto">
              {['About', 'My Posts', 'Activity', 'Settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-2 font-bold text-lg transition-all relative whitespace-nowrap ${
                    activeTab === tab ? 'text-accent-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-600 rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in duration-200">
            {activeTab === 'About' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={() => setActiveTab('Activity')}
                    className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-left hover:bg-slate-100 transition-all group"
                  >
                    <div className="flex items-center gap-4 mb-1">
                      <div className="p-2 bg-white rounded-xl shadow-sm"><PenSquare className="h-5 w-5 text-accent-600" /></div>
                      <span className="font-bold text-slate-900 uppercase text-xs tracking-widest">Questions Posted</span>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 ml-12">{myPosts.length}</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('Activity')}
                    className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-left hover:bg-slate-100 transition-all group"
                  >
                    <div className="flex items-center gap-4 mb-1">
                      <div className="p-2 bg-white rounded-xl shadow-sm"><MessageSquare className="h-5 w-5 text-accent-600" /></div>
                      <span className="font-bold text-slate-900 uppercase text-xs tracking-widest">Replies Provided</span>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 ml-12">{myReplies.length}</p>
                  </button>
                </div>

                <div className="space-y-6 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-slate-50 rounded-xl"><Calendar className="h-5 w-5 text-slate-400" /></div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Joined</span>
                      <span className="text-slate-500">{joinedDate}</span>
                    </div>
                  </div>

                  
                  {user.interests && (
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-slate-50 rounded-xl"><Heart className="h-5 w-5 text-slate-400" /></div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Interests</span>
                        <span className="text-slate-500">{user.interests}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'My Posts' && (
              <div className="space-y-4">
                {myPosts.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">You haven't asked any questions yet.</p>
                  </div>
                ) : (
                  myPosts.map(post => <PostCard key={post.id} post={post} />)
                )}
              </div>
            )}

            {activeTab === 'Activity' && (
              <div>
                <div className="flex gap-4 mb-6">
                  {['Upvotes', 'Replies'].map(sub => (
                    <button
                      key={sub}
                      onClick={() => setActivityTab(sub === 'Replies' ? 'My Replies' : sub)}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${
                        (activityTab === sub || (sub === 'Replies' && activityTab === 'My Replies')) ? 'bg-accent-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-4">
                  {activityTab === 'Upvotes' && (
                    myUpvotes.length === 0 ? (
                      <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium">No upvoted posts yet.</p>
                      </div>
                    ) : myUpvotes.map(post => <PostCard key={post.id} post={post} />)
                  )}

                  {activityTab === 'My Replies' && (
                    myReplies.length === 0 ? (
                      <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium">No replies posted yet.</p>
                      </div>
                    ) : myReplies.map(reply => (
                      <div key={reply.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-sm text-slate-500 mb-2 font-bold uppercase tracking-tight">
                          You answered:
                        </div>
                        <Link to={`/post/${reply.post.id}`} className="block mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <img src={reply.post.author.avatar ?? '/Blank profile.png'} alt="" className="w-5 h-5 rounded-full" />
                            <span className="font-semibold text-slate-700">{reply.post.author.name}</span>
                          </div>
                          <h3 className="text-slate-900 font-extrabold group-hover:text-green-600 transition-colors line-clamp-2">
                            {reply.post.title || reply.post.question}
                          </h3>
                        </Link>
                        <div className="bg-accent-50/50 p-4 rounded-xl border border-accent-100">
                          <p className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'Settings' && (
              <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-8 space-y-8 animate-in slide-in-from-top-4 duration-300">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-accent-600" />
                    Account Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <button className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-accent-200 transition-all group opacity-50 cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-700">Notification Preferences</span>
                      </div>
                      <Globe className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-accent-600" />
                    Privacy & Security
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-700">Public Profile</p>
                        <p className="text-xs text-slate-500">Allow everyone to see your activity</p>
                      </div>
                      <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none bg-accent-600">
                        <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <RightSidebar />

      {/* Followers/Following Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{modalType}</h3>
              <button 
                onClick={() => setModalType(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {modalData.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-medium italic">No users found.</div>
              ) : modalData.map(u => (
                <div key={u.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors group cursor-pointer"
                     onClick={() => { navigate(`/user/${u.id}`); setModalType(null); }}>
                  <img src={u.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate group-hover:text-accent-600 transition-colors uppercase text-sm tracking-wide">{u.username}</p>
                    <p className="text-xs text-slate-500 font-medium truncate">{u.role || 'Member'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
