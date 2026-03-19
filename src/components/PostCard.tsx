import { useState } from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal, MessageSquare, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PostCard = ({ post }: { post: any }) => {
  const { token } = useAuth();
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [voteStatus, setVoteStatus] = useState<'up' | 'down' | null>(null);

  const handleVote = async (type: 'up' | 'down') => {
    if (!token) {
      alert("Please login to vote");
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

  return (
    <article className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow mb-4 group cursor-pointer">
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
              <img src={post.author.avatar} alt="" className="h-10 w-10 rounded-full border border-slate-200" />
              <div>
                <p className="text-sm font-semibold text-slate-900 leading-none">
                  {post.author.name}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {post.author.role} <span className="mx-1">•</span> {post.timeAgo}
                </p>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-3 mb-2 break-words">
            {post.title}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
            {post.content}
          </p>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {post.tags.map((tag: string) => (
              <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-6 text-slate-500">
            <button className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">{post.comments} Comments</span>
            </button>
            <button className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors">
              <Share2 className="h-4 w-4" />
              <span className="font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
