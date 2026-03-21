import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';
import { UserHoverCard } from '../components/UserHoverCard';

const formatContentWithMentions = (question: string) => {
  if (!question) return null;
  const parts = question.split(/(@\w+|#\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return <span key={i} className="text-blue-600 font-semibold cursor-pointer hover:underline">{part}</span>;
    }
    if (part.startsWith('#')) {
      return <span key={i} className="text-purple-600 font-semibold cursor-pointer hover:underline">{part}</span>;
    }
    return part;
  });
};

export const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Voting states
  const [upvotes, setUpvotes] = useState(0);
  const [voteStatus, setVoteStatus] = useState<'up' | 'down' | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
        const [postRes, commentsRes] = await Promise.all([
          fetch(`http://localhost:3000/api/posts/${id}`, { headers }),
          fetch(`http://localhost:3000/api/posts/${id}/comments`)
        ]);

        if (postRes.ok && commentsRes.ok) {
          const postData = await postRes.json();
          const commentsData = await commentsRes.json();
          setPost(postData);
          setUpvotes(postData.upvotes);
          setVoteStatus(postData.userVote);
          setComments(commentsData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPostAndComments();
  }, [id, token]);

  const handleVote = async (type: 'up' | 'down') => {
    if (!token) { alert('Please login to vote'); return; }
    if (isVoting) return;
    setIsVoting(true);

    try {
      const isRemoving = voteStatus === type;
      let delta = 0;
      if (isRemoving) { delta = type === 'up' ? -1 : 1; setVoteStatus(null); } 
      else {
        if (voteStatus) delta = type === 'up' ? 2 : -2;
        else delta = type === 'up' ? 1 : -1;
        setVoteStatus(type);
      }
      setUpvotes((prev) => prev + delta);

      const res = await fetch(`http://localhost:3000/api/posts/${id}/vote`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
      setIsVoting(true); setTimeout(() => setIsVoting(false), 200);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!token) { alert("Please login to answer"); return; }
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`http://localhost:3000/api/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ question: newComment, parentId: null }) // Using question as backend expects it for comments now
      });
      if (res.ok) {
        setNewComment('');
        const commentsRes = await fetch(`http://localhost:3000/api/posts/${id}/comments`);
        if (commentsRes.ok) setComments(await commentsRes.json());
      }
    } catch (e) {
      console.error('Failed to post answer', e);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
        <Sidebar /><div className="flex-1 py-10 text-center text-slate-500 font-medium">Loading question...</div><RightSidebar />
      </main>
    );
  }

  if (!post) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
        <Sidebar /><div className="flex-1 py-10 text-center text-slate-500 font-medium">Question not found.</div><RightSidebar />
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
      <Sidebar />
      <div className="flex-1 py-6 lg:px-8 min-w-0">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-4 group text-sm font-medium">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to feed
        </Link>

        {/* Question Header */}
        <article className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 pb-20">
          <div className="flex items-start gap-5">
            {/* Voting */}
            <div className="flex flex-col items-center bg-slate-50 p-2 rounded-xl border border-slate-100 flex-shrink-0">
              <button onClick={() => handleVote('up')} className={`p-1.5 rounded-md hover:bg-slate-200 transition-colors ${voteStatus === 'up' ? 'text-blue-600' : 'text-slate-400'}`}>
                <ChevronUp className="h-6 w-6" />
              </button>
              <span className={`font-bold text-lg my-2 ${voteStatus === 'up' ? 'text-blue-600' : voteStatus === 'down' ? 'text-red-600' : 'text-slate-700'}`}>
                {upvotes}
              </span>
              <button onClick={() => handleVote('down')} className={`p-1.5 rounded-md hover:bg-slate-200 transition-colors ${voteStatus === 'down' ? 'text-red-600' : 'text-slate-400'}`}>
                <ChevronDown className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {post.domain && (
                <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-sm font-bold mb-4">
                  {post.domain}
                </span>
              )}
              <h1 className="text-2xl font-bold text-slate-900 break-words leading-relaxed whitespace-pre-wrap mb-4">
                {formatContentWithMentions(post.question)}
              </h1>
              {post.image && (
                <div className="mb-6 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                  <img src={post.image} alt="Attachment" className="w-full max-h-96 object-cover" />
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                {post.tags?.map((tag: string) => (
                  <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                <div className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">{post.views || 0}</span> views
                </div>
                <div className="bg-slate-50 px-4 py-2 border border-slate-100 rounded-xl flex items-center gap-3">
                  <UserHoverCard userId={post.author.id}>
                    <img src={post.author.avatar} alt="" className="h-8 w-8 rounded-full border border-slate-200 object-cover cursor-pointer" />
                  </UserHoverCard>
                  <div className="text-left">
                    <p className="text-xs text-slate-500 mb-0.5">Asked {post.createdAt ? formatDistanceToNow(new Date(post.createdAt + 'Z'), { addSuffix: true }) : 'Just now'}</p>
                    <UserHoverCard userId={post.author.id}>
                      <span className="text-sm font-bold text-blue-600 hover:underline cursor-pointer">{post.author.name}</span>
                    </UserHoverCard>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Answers Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            {comments.length} {comments.length === 1 ? 'Answer' : 'Answers'}
          </h2>
          
          <div className="space-y-6">
            {comments.map(comment => (
              <div key={comment.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-base text-slate-800 whitespace-pre-wrap leading-relaxed mb-6">
                  {formatContentWithMentions(comment.question)}
                </p>
                
                <div className="flex items-center justify-end border-t border-slate-100 pt-4">
                   <div className="px-4 py-2 rounded-xl flex items-center gap-3">
                    <UserHoverCard userId={comment.author.id}>
                      <img src={comment.author.avatar} alt="" className="h-8 w-8 rounded-full border border-slate-200 object-cover cursor-pointer" />
                    </UserHoverCard>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 mb-0.5">Answered {formatDistanceToNow(new Date(comment.createdAt + 'Z'), { addSuffix: true })}</p>
                      <UserHoverCard userId={comment.author.id}>
                        <span className="text-sm font-bold text-blue-600 hover:underline cursor-pointer">{comment.author.name}</span>
                      </UserHoverCard>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Answer Input */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Your Answer</h3>
            <textarea 
              rows={5}
              placeholder="Provide answer to the post..." 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="w-full text-base p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 mb-4 resize-y font-sans"
            />
            <div className="flex justify-end">
              <button 
                onClick={handleSubmitAnswer}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Post your answer
              </button>
            </div>
          </div>

        </div>
      </div>
      <RightSidebar />
    </main>
  );
};
