import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';
import { PostCard } from '../components/PostCard';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const { token } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  const fetchPosts = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      console.error("Error fetching posts:", e);
    }
  };

  useEffect(() => {
    fetchPosts();

    const handleOpenPost = () => setIsCreatingPost(true);
    window.addEventListener('openNewPostModal', handleOpenPost);
    return () => window.removeEventListener('openNewPostModal', handleOpenPost);
  }, []);

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    if (!token) {
       alert("Please login first");
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
        body: JSON.stringify({ title: newTitle, content: newContent, tags: parsedTags })
      });
      setIsCreatingPost(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      fetchPosts();
    } catch (e) {
      console.error("Error creating post", e);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
      <Sidebar />
      
      <div className="flex-1 py-6 lg:px-8 min-w-0">
        {isCreatingPost ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 animate-in slide-in-from-top-4 fade-in duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Post</h2>
            <input 
              type="text" 
              placeholder="Title" 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full mb-4 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <textarea 
              placeholder="What are your thoughts?" 
              rows={5}
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              className="w-full mb-4 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
            <input 
              type="text" 
              placeholder="Tags (comma separated, e.g. React, UI, Web)" 
              value={newTags}
              onChange={e => setNewTags(e.target.value)}
              className="w-full mb-4 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button 
                onClick={handleCreatePost}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Publish Post
              </button>
              <button 
                onClick={() => setIsCreatingPost(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recent Discussions</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">Sort by:</span>
              <select className="bg-transparent text-sm font-semibold text-slate-900 border-none focus:ring-0 cursor-pointer outline-none">
                <option>Hot</option>
                <option>New</option>
                <option>Top</option>
              </select>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {posts.length === 0 ? (
            <p className="text-slate-500 text-sm italic">Loading posts...</p>
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
