import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';

export const UserProfile = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If they click on their own profile implicitly, bounce them to /my-profile
    if (user && user.id === Number(id)) {
       navigate('/my-profile');
       return;
    }

    const fetchProfile = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(`http://localhost:3000/api/users/${id}`, { headers });
        if (res.ok) {
           setProfile(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [id, user, token, navigate]);

  const handleFollow = async () => {
    if (!token) {
       alert("Please login to follow users");
       window.location.href = '/login';
       return;
    }
    try {
      const res = await fetch(`http://localhost:3000/api/users/${id}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev: any) => ({
           ...prev,
           isFollowing: data.following,
           expectedFollowers: prev.expectedFollowers + (data.following ? 1 : -1)
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) return <div className="text-center py-20 text-slate-500">Loading profile...</div>;
  if (!profile) return <div className="text-center py-20 text-slate-500">User not found.</div>;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
      <Sidebar />
      <div className="flex-1 py-6 lg:px-8 min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Profile</h1>
        
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 text-center sm:text-left">
            <img src={profile.avatar} className="w-32 h-32 rounded-full border-4 border-slate-100 object-cover" alt="Avatar" />
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">{profile.username}</h2>
              <div className="flex justify-center sm:justify-start gap-4 text-sm font-medium text-slate-600 mb-4">
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{profile.points || 0} Points</span>
                <span className="py-1"><b>{profile.expectedFollowers}</b> Followers</span>
                <span className="py-1"><b>{profile.expectedFollowing}</b> Following</span>
              </div>
              
              <button 
                onClick={handleFollow}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-full font-bold transition-colors ${
                  profile.isFollowing 
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20'
                }`}
              >
                {profile.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
             <h3 className="font-semibold text-slate-900 mb-2">About</h3>
             <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
               {profile.description || "This user hasn't written a description yet."}
             </p>
          </div>
        </div>
      </div>
      <RightSidebar />
    </main>
  );
};
