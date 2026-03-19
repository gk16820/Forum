import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserHoverCardProps {
  userId: number;
  children: React.ReactNode;
}

export const UserHoverCard = ({ userId, children }: UserHoverCardProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [isHovering, setIsHovering] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef<any>();

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(async () => {
      setIsHovering(true);
      if (!profile) {
        try {
          const res = await fetch(`http://localhost:3000/api/users/${userId}`);
          if (res.ok) setProfile(await res.json());
        } catch (e) {
          console.error(e);
        }
      }
    }, 400); // 400ms delay before hover triggers
  };

  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
    setIsHovering(false);
  };

  return (
    <div 
      className="relative inline-block group" 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
    >
      <div onClick={(e) => { e.stopPropagation(); navigate(`/user/${userId}`); }} className="cursor-pointer inline-block">
        {children}
      </div>

      {isHovering && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {profile ? (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <img src={profile.avatar} alt="" className="w-12 h-12 rounded-full border border-slate-100 object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate cursor-pointer hover:underline" onClick={() => navigate(`/user/${userId}`)}>{profile.username}</h4>
                  <div className="text-xs font-semibold text-slate-500 mt-0.5">
                    {profile.expectedFollowers} Followers
                  </div>
                </div>
                <button onClick={() => navigate(`/user/${userId}`)} className="text-xs bg-slate-100 font-bold hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full whitespace-nowrap self-start transition-colors">
                  View
                </button>
              </div>
              {profile.description && (
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {profile.description}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 bg-slate-100 animate-pulse rounded" />
                <div className="h-3 w-1/3 bg-slate-100 animate-pulse rounded" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
