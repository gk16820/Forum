import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal, MessageSquare, Share2, Bookmark, Eye, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { UserHoverCard } from './UserHoverCard';
import { Link } from 'react-router-dom';

const formatContentWithMentions = (question: string) => {
  if (!question) return null;
  const parts = question.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return <span key={i} className="text-blue-600 font-semibold cursor-pointer hover:underline">{part}</span>;
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
  const [editContent, setEditContent] = useState(post.question);
  const [editTags, setEditTags] = useState(post.tags?.join(', ') || '');
  const [questionContent, setQuestionContent] = useState(post.question);
  const [tagsContent, setTagsContent] = useState<string[]>(post.tags || []);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInput, setModalInput] = useState('');
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

  const handleSaveEdit = async () => {
    if (!token) return;
    try {
      const parsedTags = editTags.split(',').map((t: string) => t.trim()).filter(Boolean);
      const res = await fetch(`http://localhost:3000/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: editContent, tags: parsedTags })
      });
      if (res.ok) {
        setQuestionContent(editContent);
        setTagsContent(parsedTags);
        setIsEditing(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <article className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow mb-4">
      <div className="flex items-start gap-4">
        {/* Vote Column */}
        <div className="flex flex-col items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
          <button 
            onClick={(e) => { e.stopPropagation(); handleVote('up'); }}
            className={`p-1 rounded-md hover:bg-slate-200 transition-colors ${voteStatus === 'up' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <span className={`font-medium text-sm my-1 ${voteStatus === 'up' ? 'text-blue-600' : voteStatus === 'down' ? 'text-red-600' : 'text-slate-700'}`}>
            {upvotes}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); handleVote('down'); }}
            className={`p-1 rounded-md hover:bg-slate-200 transition-colors ${voteStatus === 'down' ? 'text-red-600' : 'text-slate-400'}`}
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3">
              <UserHoverCard userId={post.author.id}>
                <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                  <img src={post.author.avatar} alt="" className="h-10 w-10 rounded-full border border-slate-200 object-cover" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 leading-none">
                      {post.author.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formattedTime}
                    </p>
                  </div>
                </div>
              </UserHoverCard>
            </div>

            {/* More Menu */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={handleBookmark}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-blue-600 text-blue-600' : 'text-slate-400'}`} />
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
                      <><Share2 className="h-4 w-4 text-green-500" /><span className="text-green-600">Copied!</span></>
                    ) : (
                      <><Share2 className="h-4 w-4 text-slate-400" /><span>Copy Link</span></>
                    )}
                  </button>
                  {user?.id === post.author.id && (
                    <button
                      onClick={() => { setIsEditing(true); setShowMoreMenu(false); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                    >
                      <Pencil className="h-4 w-4 text-slate-400" />
                      <span>Edit Question</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="mt-3 mb-4">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full text-base p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 mb-3 resize-y font-sans"
                rows={4}
                placeholder="Question details..."
              />
              <input 
                type="text"
                value={editTags}
                onChange={e => setEditTags(e.target.value)}
                placeholder="Tags (comma separated)"
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 mb-3"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <Link to={`/post/${post.id}`} className="block mt-3 mb-4 group text-left">
              {post.domain && (
                <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-md text-xs font-bold mb-2">
                  {post.domain}
                </span>
              )}
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors break-words leading-relaxed whitespace-pre-wrap line-clamp-4">
                {formatContentWithMentions(questionContent)}
              </h2>
              {post.image && (
                <div className="mt-3 rounded-xl overflow-hidden border border-slate-100">
                  <img src={post.image} alt="Attachment" className="max-h-64 object-cover w-full" />
                </div>
              )}
            </Link>
          )}

          {!isEditing && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {tagsContent.map((tag: string) => (
                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 text-slate-500">
            <Link to={`/post/${post.id}`} className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors cursor-pointer">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">{post.comments || 0} Answers</span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Eye className="h-4 w-4" />
              <span className="font-medium">{post.views || 0} Views</span>
            </div>
          </div>
          
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm animate-in fade-in duration-200" onClick={e => e.stopPropagation()}>
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">
              {modalType === 'initial-bookmark' ? 'Save to Bookmark List' : 'Move to List'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">Select an existing list to save this bookmark into.</p>
            {availableLists.length > 0 ? (
              <select
                autoFocus
                value={modalInput}
                onChange={e => setModalInput(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 focus:bg-white cursor-pointer"
              >
                {availableLists.map(list => <option key={list} value={list}>{list}</option>)}
              </select>
            ) : (
              <input 
                type="text"
                autoFocus
                value={modalInput}
                onChange={e => setModalInput(e.target.value)}
                placeholder="List name..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 focus:bg-white"
                onKeyDown={e => e.key === 'Enter' && handleModalSubmit()}
              />
            )}
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleModalSubmit}
                 className="px-5 py-2.5 font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 rounded-xl transition-colors"
               >
                 Save
               </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
