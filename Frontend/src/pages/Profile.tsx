import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';
import { API_BASE_URL } from '../config';

export const Profile = () => {
  const { user, token, login } = useAuth();
  const [avatar, setAvatar] = useState(user?.avatar || '/Blank profile.png');
  const [role, setRole] = useState(user?.role || 'Member');
  const [success, setSuccess] = useState(false);

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ avatar, role })
      });
      const data = await res.json();
      if (res.ok) {
        if (token) {
           login(token, data.user);
           setSuccess(true);
           setTimeout(() => setSuccess(false), 3000);
        }
      } else {
        alert("Failed to update");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return <div className="text-center py-20">Please login first.</div>;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
      <Sidebar />
      <div className="flex-1 py-6 lg:px-8 min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">User Profile</h1>
        
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
          <div className="flex items-center gap-6 mb-8">
            <img src={avatar} className="w-24 h-24 rounded-full border-4 border-slate-100 object-cover" alt="Profile" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{user.username}</h2>
              <p className="text-slate-500">{user.points || 0} Points</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Avatar URL</label>
              <input 
                type="text" 
                value={avatar}
                onChange={e => setAvatar(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" 
                placeholder="https://..."
              />
              <p className="text-xs text-slate-500 mt-1">Upload your avatar image</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role/Title</label>
              <input 
                type="text" 
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Frontend Developer"
              />
            </div>

            {success && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg font-medium">Profile successfully updated!</div>}

            <button 
              onClick={handleUpdate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Save Profile Settings
            </button>
          </div>
        </div>
      </div>
      <RightSidebar />
    </main>
  );
};
