import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Calendar, Heart, Briefcase, Globe, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { PostCard } from '../components/PostCard';
import { UserHoverCard } from '../components/UserHoverCard';
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

  const joinedDate = format(new Date(), 'MMM yyyy'); // Will come from user.createdAt once extended

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex bg-white min-h-screen">
      <Sidebar />
      <div className="flex-1 py-8 lg:px-12 min-w-0">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
          <button
            onClick={() => navigate('/my-profile/edit')}
            title="Edit Profile"
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-blue-600 group"
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
              <div className="absolute bottom-4 right-4 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
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
                    No description yet. <button onClick={() => navigate('/my-profile/edit')} className="text-blue-500 underline">Add one</button>
                  </span>
                )}
              </p>

              {profile && (
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="bg-slate-50 px-8 py-3 rounded-2xl border border-slate-100 min-w-[140px]">
                    <p className="text-2xl font-bold text-slate-900">{profile.expectedFollowers || 0}</p>
                    <p className="text-slate-500 font-medium text-sm">Followers</p>
                  </div>
                  <div className="bg-slate-50 px-8 py-3 rounded-2xl border border-slate-100 min-w-[140px]">
                    <p className="text-2xl font-bold text-slate-900">{profile.expectedFollowing || 0}</p>
                    <p className="text-slate-500 font-medium text-sm">Following</p>
                  </div>
                </div>
              )}

              <p className="text-sm font-semibold text-slate-400 mt-4">Points: {user.points || 0}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-100 mb-8">
            <div className="flex gap-8 overflow-x-auto">
              {['About', 'My Posts', 'Activity'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-2 font-bold text-lg transition-all relative whitespace-nowrap ${
                    activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'About' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-50 rounded-xl"><Calendar className="h-5 w-5 text-slate-400" /></div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Joined</span>
                  <span className="text-slate-500">{joinedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-50 rounded-xl"><Briefcase className="h-5 w-5 text-slate-400" /></div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Role</span>
                  <span className="text-slate-500">{user.role || <span className="italic text-slate-300">Not set</span>}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-50 rounded-xl"><Globe className="h-5 w-5 text-slate-400" /></div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Domain</span>
                  <span className="text-slate-500">{user.domain || <span className="italic text-slate-300">Not set</span>}</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-50 rounded-xl mt-0.5"><MessageSquare className="h-5 w-5 text-slate-400" /></div>
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Description</span>
                  <span className="text-slate-500 leading-relaxed">
                    {user.description || <span className="italic text-slate-300">No description provided.</span>}
                  </span>
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
          )}

          {activeTab === 'My Posts' && (
            <div className="space-y-4 animate-in fade-in duration-200">
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
            <div className="animate-in fade-in duration-200">
              <div className="flex gap-4 mb-6">
                {['Upvotes', 'My Replies'].map(sub => (
                  <button
                    key={sub}
                    onClick={() => setActivityTab(sub)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                      activityTab === sub ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                      <div className="text-sm text-slate-500 mb-2">
                        You answered this question:
                      </div>
                      <Link to={`/post/${reply.post.id}`} className="block mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                          <img src={reply.post.author.avatar} alt="" className="w-5 h-5 rounded-full" />
                          <span className="font-semibold text-slate-700">{reply.post.author.name}</span>
                        </div>
                        <h3 className="text-slate-900 font-semibold group-hover:text-blue-600 transition-colors line-clamp-2">
                          {reply.post.question}
                        </h3>
                      </Link>
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <p className="text-slate-800 text-sm whitespace-pre-wrap">{reply.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      <RightSidebar />
    </main>
  );
};
