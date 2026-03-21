import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';
import { PostCard } from '../components/PostCard';
import { ImagePlus } from 'lucide-react';

export const CommunityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Post creation state
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);

  const fetchCommunity = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:3000/api/communities/${id}`, { headers });
      if (res.ok) setCommunity(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPosts = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:3000/api/posts?communityId=${id}`, { headers });
      if (res.ok) setPosts(await res.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCommunity();
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const handleCreatePost = async () => {
    if (!newQuestion.trim()) {
       alert("Please fill in the Question field");
       return;
    }
    try {
      const parsedTags = newTags.split(',').map(tag => tag.trim()).filter(t => t.length > 0);
      await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: 'Community Post', 
          question: newQuestion, 
          tags: parsedTags,
          domain: 'Community', // Domain is required by the API, so we provide a default
          image: newImage,
          communityId: id
        })
      });
      setIsCreatingPost(false);
      setNewQuestion('');
      setNewTags('');
      setNewImage(null);
      fetchPosts();
    } catch (e) {
      console.error("Error creating community post", e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleJoin = async () => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${id}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchCommunity();
    } catch (e) {
      console.error(e);
    }
  };

  if (!community && loading) {
    return <div className="text-center p-12">Loading...</div>;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
      <Sidebar />
      <div className="flex-1 py-6 lg:px-8 min-w-0">
        {community && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-6 animate-in slide-in-from-top-4 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{community.name}</h1>
                <p className="text-sm text-slate-500 mt-1">Created by {community.creatorName}</p>
              </div>
              {token && (
                <button
                  onClick={handleJoin}
                  disabled={community.isMember}
                  className={`px-5 py-2 font-semibold rounded-xl transition-colors ${
                    community.isMember
                      ? 'bg-slate-100 text-slate-500 cursor-default'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
                  }`}
                >
                  {community.isMember ? 'Joined' : 'Join Community'}
                </button>
              )}
            </div>
            <p className="text-slate-700 text-lg mb-6 leading-relaxed">{community.description}</p>
            <div className="flex gap-4">
              <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                <span className="block text-2xl font-bold text-slate-900">{community.memberCount}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Followers</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Community Posts</h2>
          {user?.userType === 'guvi faculty' && (
            <button
              onClick={() => setIsCreatingPost(!isCreatingPost)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm shadow-blue-500/20"
            >
              {isCreatingPost ? 'Cancel' : 'New Post'}
            </button>
          )}
        </div>

        {isCreatingPost && user?.userType === 'guvi faculty' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 animate-in slide-in-from-top-4 fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Create a Community Post</h3>
            <textarea 
              placeholder="What's your post?" 
              rows={4}
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              className="w-full mb-4 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
            <div className="mb-4">
              <input 
                type="text" 
                placeholder="Tags (comma separated, optional)" 
                value={newTags}
                onChange={e => setNewTags(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            {newImage && (
              <div className="mb-4 relative rounded-xl overflow-hidden border border-slate-200 inline-block">
                <img src={newImage} alt="Preview" className="h-32 object-cover" />
                <button onClick={() => setNewImage(null)} className="absolute top-2 right-2 bg-slate-900/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors">✕</button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <label className="cursor-pointer flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50">
                <ImagePlus className="w-5 h-5" />
                <span className="text-sm font-medium">Attach Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              <button 
                onClick={handleCreatePost}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500">No posts in this community yet.</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>
      <RightSidebar />
    </main>
  );
};
