import { useState } from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal, MessageSquare, Share2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { UserHoverCard } from './UserHoverCard';

const formatContentWithMentions = (content: string) => {
  const parts = content.split(/(@\w+)/g);
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
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedTime = post.createdAt ? formatDistanceToNow(new Date(post.createdAt + 'Z'), { addSuffix: true }) : 'Just now';

  const fetchComments = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(!showComments);
  };

  const handleVote = async (type: 'up' | 'down') => {
    if (!token) {
      alert("Please login to upvote or downvote");
      window.location.href = '/login';
      return;
    }
    
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
      setUpvotes(upvotes + delta);

      await fetch(`http://localhost:3000/api/posts/${post.id}/vote`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: isRemoving ? (type === 'up' ? 'down' : 'up') : type })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitComment = async () => {
    if (!token) {
       alert("Please login to comment");
       window.location.href = '/login';
       return;
    }
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`http://localhost:3000/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment, parentId: replyTo })
      });
      if (res.ok) {
        setNewComment('');
        setReplyTo(null);
        fetchComments();
      }
    } catch (e) {
      console.error('Failed to post comment', e);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-3 mb-2 break-words leading-tight">
            {post.title}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
            {formatContentWithMentions(post.content)}
          </p>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {post.tags?.map((tag: string) => (
              <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-6 text-slate-500">
            <button onClick={toggleComments} className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">{post.comments || comments.length} Comments</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowSharePopover(!showSharePopover)}
                className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span className="font-medium">Share</span>
              </button>
              
              {showSharePopover && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <p className="text-sm font-bold text-slate-900 mb-3">Share this discussion</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}/post/${post.id}`}
                      className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 outline-none"
                    />
                    <button 
                      onClick={handleCopyLink}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-4 translate-y-1/2 rotate-45 w-3 h-3 bg-white border-r border-b border-slate-200"></div>
                </div>
              )}
            </div>
          </div>
          
          {showComments && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 text-sm">Discussions</h3>
              
              <div className="space-y-4 mb-4 max-h-64 overflow-y-auto pr-2">
                {comments.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No comments yet. Be the first to share your thoughts!</p>
                ) : comments.map(comment => (
                  <div key={comment.id} className={`flex gap-3 ${comment.parentId ? 'ml-8 relative' : ''}`}>
                    {comment.parentId && <div className="absolute -left-6 top-0 bottom-4 w-px bg-slate-200" />}
                    {comment.parentId && <div className="absolute -left-6 top-4 w-4 h-px bg-slate-200" />}
                    
                    <UserHoverCard userId={comment.author.id}>
                      <img src={comment.author.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                    </UserHoverCard>
                    
                    <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex justify-between items-start mb-1">
                        <UserHoverCard userId={comment.author.id}>
                            <span className="font-bold text-xs text-slate-900 hover:underline">{comment.author.name}</span>
                        </UserHoverCard>
                        <span className="text-[10px] text-slate-500">
                          {formatDistanceToNow(new Date(comment.createdAt + 'Z'), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{formatContentWithMentions(comment.content)}</p>
                      
                      <button 
                        onClick={() => {
                          setReplyTo(comment.id);
                          setNewComment(`@${comment.author.name} `);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2 block"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment Input */}
              <div className="flex gap-2 items-center mt-2 relative">
                {user ? <img src={user.avatar} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-slate-200" />}
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder={replyTo ? "Write a reply..." : "Add a comment..."} 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
                    className="w-full text-sm py-2 pl-3 pr-10 border border-slate-300 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                  <button 
                    onClick={handleSubmitComment}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-blue-600 p-1 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {replyTo && (
                <p className="text-[10px] text-slate-500 ml-10 mt-1 cursor-pointer hover:underline" onClick={() => {setReplyTo(null); setNewComment('')}}>
                  Cancel reply
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
