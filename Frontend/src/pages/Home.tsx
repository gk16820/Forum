import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';
import { PostCard } from '../components/PostCard';
import { DomainSelect } from '../components/DomainSelect';
import { useAuth } from '../context/AuthContext';
import { ImagePlus } from 'lucide-react';

export const Home = () => {
  const { token } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDomain, setNewDomain] = useState<string[]>([]);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('New');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const AVAILABLE_CATEGORIES = [
    'Career guidance', 'Placement preparation', 'GUVI Courses', 
    'Learning resourses', 'General advise', 'Debugging/Troubleshooting', 
    'Tools Suggestion'
  ];

  const fetchPosts = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:3000/api/posts?sort=${sortBy.toLowerCase()}`, { headers });
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
  }, [sortBy]);

  useEffect(() => {
    const handleOpenPost = () => setIsCreatingPost(true);
    window.addEventListener('openNewPostModal', handleOpenPost);
    return () => window.removeEventListener('openNewPostModal', handleOpenPost);
  }, []);

  const handleCreatePost = async () => {
    if (!newQuestion.trim() || newDomain.length === 0 || !newCategory) {
       alert("Please fill in the required fields (Question, Domain, Category)");
       return;
    }
    if (!token) {
       alert("Please login first");
       return;
    }
    
    try {
      const res = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: newTitle || 'Question', 
          question: newQuestion, 
          category: newCategory,
          domain: newDomain,
          image: newImage 
        })
      });
      if (res.ok) {
        setIsCreatingPost(false);
        setNewTitle('');
        setNewQuestion('');
        setNewCategory('');
        setNewDomain([]);
        setNewImage(null);
        fetchPosts();
      } else {
        const errorData = await res.json();
        alert(`Failed to post: ${errorData.error || 'Server error'}`);
      }
    } catch (e) {
      console.error("Error creating post", e);
      alert("Failed to connect to server");
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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
      <Sidebar />
      
      <div className="flex-1 py-6 lg:px-8 min-w-0">
        {isCreatingPost ? (
          <div className="bg-surface p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 animate-in slide-in-from-top-4 fade-in duration-200">
            <h2 className="text-xl font-bold text-primary mb-4">Ask a Question</h2>
            <input 
              type="text"
              placeholder="Question Title (Required)" 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full mb-3 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:outline-none font-bold text-lg"
            />
            <textarea 
              placeholder="Explain your question in detail..." 
              rows={5}
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              className="w-full mb-4 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:outline-none resize-none"
            />
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <button 
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full h-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:outline-none text-left flex justify-between items-center text-slate-500 font-medium whitespace-nowrap overflow-hidden"
                >
                  <span className="truncate">
                    {newCategory || 'Select Category'}
                  </span>
                  <span className="text-[10px]">▼</span>
                </button>
                
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                    {AVAILABLE_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setNewCategory(cat);
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-slate-50 last:border-0 hover:bg-slate-50 ${newCategory === cat ? 'text-accent-600 bg-accent-50/30' : 'text-slate-600'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <DomainSelect value={newDomain} onChange={setNewDomain} placeholder="Select Domain(s)" />
              </div>
            </div>
            {newImage && (
              <div className="mb-4 relative rounded-xl overflow-hidden border border-slate-200 inline-block">
                <img src={newImage} alt="Preview" className="h-32 object-cover" />
                <button onClick={() => setNewImage(null)} className="absolute top-2 right-2 bg-slate-900/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors">✕</button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer flex items-center gap-2 text-slate-500 hover:text-accent-600 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50">
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-sm font-medium">Attach Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsCreatingPost(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreatePost}
                  className="bg-accent-600 hover:bg-accent-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors shadow-md shadow-accent-600/20"
                >
                  Publish Post
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-primary tracking-tight">Recent Discussions</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary font-medium">Sort by:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm font-semibold text-primary border-none focus:ring-0 cursor-pointer outline-none"
              >
                <option value="Popular">Popular</option>
                <option value="New">New</option>
                {/* <option>Trending</option> */}
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
