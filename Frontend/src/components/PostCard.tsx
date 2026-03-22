import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal, MessageSquare, Share2, Bookmark, Eye, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { UserHoverCard } from './UserHoverCard';
import { DomainSelect } from './DomainSelect';
import { Link } from 'react-router-dom';

const formatContentWithMentions = (question: string) => {
  if (!question) return null;
  const parts = question.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return <span key={i} className="text-accent-600 font-semibold cursor-pointer hover:underline">{part}</span>;
    }
    return part;
  });
};

export const PostCard = ({ post }: { post: any }) => {
  const { token, user } = useAuth();
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [voteStatus, setVoteStatus] = useState<'up' | 'down' | null>(post.userVote || null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    setUpvotes(post.upvotes);
    setVoteStatus(post.userVote || null);
  }, [post.upvotes, post.userVote]);
  
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(post.isBookmarked || false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [titleContent, setTitleContent] = useState(post.title || '');
  const [questionContent, setQuestionContent] = useState(post.question);
  
  // Safe normalization of domain and categories
  const normalizedDomain = Array.isArray(post.domain) ? post.domain : (post.domain ? [post.domain] : []);
  const normalizedCategory = post.category || '';

  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editContent, setEditContent] = useState(post.question);
  const [editCategory, setEditCategory] = useState<string>(normalizedCategory);
  const [editDomain, setEditDomain] = useState<string[]>(normalizedDomain);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const AVAILABLE_CATEGORIES = [
    'Career guidance', 'Placement preparation', 'GUVI Courses', 
    'Learning resourses', 'General advise', 'Debugging/Troubleshooting', 
    'Tools Suggestion'
  ];

  const moreMenuRef = useRef<HTMLDivElement>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInput, setModalInput] = useState('General');
  const [modalType, setModalType] = useState<'initial-bookmark' | 'move'>('initial-bookmark');
  const [availableLists, setAvailableLists] = useState<string[]>(['General']);

  useEffect(() => {
    setIsBookmarked(post.isBookmarked || false);
  }, [post.isBookmarked]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formattedTime = post.createdAt ? formatDistanceToNow(new Date(post.createdAt + 'Z'), { addSuffix: true }) : 'Just now';

  const handleVote = async (type: 'up' | 'down') => {
    if (!token) {
      alert("Please login to upvote or downvote");
      window.location.href = '/login';
      return;
    }
    
    if (isVoting) return;
    setIsVoting(true);

    try {
       const isRemoving = voteStatus === type;
       let delta = 0;
       if (isRemoving) {
         delta = type === 'up' ? -1 : 1;
         setVoteStatus(null);
       } else {
         if (voteStatus) {
           delta = type === 'up' ? 2 : -2;
         } else {
           delta = type === 'up' ? 1 : -1;
         }
         setVoteStatus(type);
       }
       setUpvotes((prev: number) => prev + delta);

      const res = await fetch(`http://localhost:3000/api/posts/${post.id}/vote`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        const data = await res.json();
        setUpvotes(data.upvotes);
        setVoteStatus(data.userVote);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsVoting(true);
      setTimeout(() => setIsVoting(false), 200); 
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openBookmarkModal = async (type: 'initial-bookmark' | 'move') => {
    try {
      const res = await fetch('http://localhost:3000/api/bookmarks/lists', {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableLists(data.filter((l: string) => l !== 'All'));
      }
    } catch(e) {}
    setModalType(type);
    setModalInput(post.bookmarkCategory || 'General');
    setModalOpen(true);
    setShowMoreMenu(false);
  };

  const handleBookmark = async () => {
    if (!token) { alert('Please login to bookmark posts'); return; }
    
    try {
      if (isBookmarked) {
        setIsBookmarked(false);
        await fetch(`http://localhost:3000/api/bookmarks/${post.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        await openBookmarkModal('initial-bookmark');
      }
    } catch (e) {
      setIsBookmarked(!isBookmarked); // revert on error
    }
    setShowMoreMenu(false);
  };

  const handleMoveBookmark = async () => {
    if (!token) return;
    await openBookmarkModal('move');
  };

  const handleModalSubmit = async () => {
    if (!modalInput.trim()) return;
    try {
      setIsBookmarked(true);
      await fetch(`http://localhost:3000/api/bookmarks/${post.id}`, {
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: modalInput.trim() })
      });
      setModalOpen(false);
      // Reload page only if we moved it inside Bookmarks route so UI updates
      if (modalType === 'move' && window.location.pathname.includes('bookmarks')) {
         window.location.reload(); 
      }
    } catch(e) {}
  };

  const handleDeletePost = async () => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this post? This will remove all associated votes and comments.")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch(e) {
      alert("Failed to delete post");
    }
    setShowMoreMenu(false);
  };

  const handleSaveEdit = async () => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3000/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: editTitle, 
          question: editContent, 
          category: editCategory,
          domain: editDomain
        })
      });
      if (res.ok) {
        setTitleContent(editTitle);
        setQuestionContent(editContent);
        // Using global reload or local state update. Let's do local state.
        // We'll trust the parent or just reload to ensure everything is consistent.
        window.location.reload(); 
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <article className={`bg-surface p-6 rounded-2xl border border-slate-200 transition-all hover:shadow-md mb-4 ${isEditing ? 'ring-2 ring-brand-100 border-brand-200 shadow-lg' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Vote Column */}
        <div className="flex flex-col items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
          <button 
            onClick={(e) => { e.stopPropagation(); handleVote('up'); }}
            className={`p-1 rounded-md hover:bg-slate-200 transition-colors ${voteStatus === 'up' ? 'text-royal-purple' : 'text-slate-400'}`}
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <span className={`font-bold text-sm my-1 ${voteStatus === 'up' ? 'text-royal-purple' : voteStatus === 'down' ? 'text-red-500' : 'text-primary'}`}>
            {upvotes}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); handleVote('down'); }}
            className={`p-1 rounded-md hover:bg-slate-200 transition-colors ${voteStatus === 'down' ? 'text-red-500' : 'text-slate-400'}`}
          >
            <ChevronDown className="h-5 w-5" />
          </button>
          
          <div className="mt-4 pt-4 border-t border-slate-200/50 w-full flex flex-col items-center text-slate-400">
             <Eye className="h-4 w-4" />
             <span className="text-[10px] font-bold mt-1 text-slate-500 tracking-tighter">{post.views || 0}</span>
          </div>
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-4 min-w-0">
            <div className="flex gap-2 flex-wrap">
              {post.category && (
                <Link to={`/search?status=${post.category === 'answered' ? 'answered' : post.category === 'unanswered' ? 'unanswered' : ''}`} className="inline-block px-3 py-1 bg-accent-50 text-accent-900 border border-accent-100 rounded-lg text-[12px] font-bold shadow-sm hover:bg-accent-100 transition-colors shrink-0">
                  {post.category}
                </Link>
              )}
            </div>
            
            <div className="flex items-center gap-3 ml-auto shrink-0">
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <UserHoverCard userId={post.author.id}>
                    <p className="text-sm font-bold text-primary hover:underline cursor-pointer">
                      {post.author.name}
                    </p>
                  </UserHoverCard>
                  <p className="text-[11px] text-secondary">
                    {formattedTime}
                  </p>
                </div>
                <UserHoverCard userId={post.author.id}>
                  <img src={post.author.avatar} alt="" className="h-8 w-8 rounded-full border border-slate-200 object-cover cursor-pointer hover:opacity-80 transition-opacity" />
                </UserHoverCard>
              </div>

              {/* More Menu */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="text-slate-400 hover:text-accent-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-surface rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      onClick={handleBookmark}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-brand-600 text-brand-600' : 'text-slate-400'}`} />
                      {isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                    </button>
                    {isBookmarked && (
                      <button
                        onClick={handleMoveBookmark}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                      >
                        <span className="text-slate-400 font-bold ml-1">→</span>
                        Move to List
                      </button>
                    )}
                    <button
                      onClick={() => { handleCopyLink(); setShowMoreMenu(false); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                    >
                      {copied ? (
                        <><Share2 className="h-4 w-4 text-brand-600" /><span className="text-brand-600">Copied!</span></>
                      ) : (
                        <><Share2 className="h-4 w-4 text-slate-400" /><span>Copy Link</span></>
                      )}
                    </button>
                    {user?.id === post.author.id && (
                      <>
                        <button
                          onClick={() => { setIsEditing(true); setShowMoreMenu(false); }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                        >
                          <Pencil className="h-4 w-4 text-slate-400" />
                          <span>Edit Question</span>
                        </button>
                        <button
                          onClick={handleDeletePost}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                        >
                          <span className="text-red-400 font-bold ml-1 text-lg">✕</span>
                          <span>Delete Post</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="mt-3 mb-4">
              <input 
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Post title..."
                className="w-full text-lg font-bold p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-slate-50 mb-3"
              />
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full text-base p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-slate-50 mb-3 resize-y font-sans"
                rows={4}
                placeholder="Question details..."
              />
              <div className="flex gap-3 mb-3">
                <div className="flex-1 relative">
                  <button 
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full h-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:outline-none text-left flex justify-between items-center text-slate-500 font-medium bg-slate-50 overflow-hidden"
                  >
                    <span className="truncate">
                      {editCategory || 'Category'}
                    </span>
                    <span className="text-[10px]">▼</span>
                  </button>
                  
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[60] overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                      {AVAILABLE_CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setEditCategory(cat);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-slate-50 last:border-0 hover:bg-slate-50 ${editCategory === cat ? 'text-accent-600 bg-accent-50/30' : 'text-slate-600'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <DomainSelect value={editDomain} onChange={setEditDomain} placeholder="Domains" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <Link to={`/post/${post.id}`} className="block mt-1 mb-4 group text-left">
              {titleContent && (
                <h2 className="text-xl font-extrabold text-primary group-hover:text-navy-blue transition-colors break-words leading-tight mb-2 line-clamp-2">
                  {titleContent}
                </h2>
              )}
              <div className="text-base text-secondary group-hover:text-slate-700 transition-colors break-words leading-relaxed whitespace-pre-wrap line-clamp-3">
                {formatContentWithMentions(questionContent)}
              </div>
              {post.image && (
                <div className="mt-3 rounded-xl overflow-hidden border border-slate-100">
                  <img src={post.image} alt="Attachment" className="max-h-64 object-cover w-full" />
                </div>
              )}
            </Link>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
            <Link to={`/post/${post.id}`} className="flex items-center gap-2 text-sm hover:text-slate-300 transition-colors cursor-pointer text-slate-500">
              <MessageSquare className="h-4 w-4" />
              <span className="font-bold">{post.comments || 0} Answers</span>
            </Link>

             <div className="flex items-center gap-2 flex-wrap justify-end">
              {normalizedDomain.map((d: string) => (
                <Link key={d} to={`/search?domain=${encodeURIComponent(d)}`} className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold text-black border border-navy-blue/30 bg-white hover:text-slate-400 hover:border-slate-300 transition-colors cursor-pointer">
                  #{d}
                </Link>
              ))}
            </div>
          </div>
          
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm animate-in fade-in duration-200" onClick={e => e.stopPropagation()}>
          <div className="bg-surface p-6 rounded-2xl w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-primary mb-2 tracking-tight text-center">
              {modalType === 'initial-bookmark' ? 'Save Bookmark' : 'Move Bookmark'}
            </h3>
            <p className="text-sm text-slate-500 mb-6 text-center">Select a list to organize your bookmarks.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select List</label>
                <select
                  autoFocus
                  value={modalInput}
                  onChange={e => setModalInput(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-600 bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  {availableLists.map(list => <option key={list} value={list}>{list}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-5 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleModalSubmit}
                  className="flex-1 px-5 py-3 font-bold bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/20 rounded-xl transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
