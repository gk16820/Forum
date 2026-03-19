import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';

export const MyProfile = () => {
  const { user, token, login } = useAuth();
  const [avatar, setAvatar] = useState(user?.avatar || '/Blank profile.png');
  const [description, setDescription] = useState(user?.description || '');
  const [location, setLocation] = useState(user?.location || '');
  const [interests, setInterests] = useState(user?.interests || '');
  const [success, setSuccess] = useState(false);

  const handleUpdate = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ avatar, description, location, interests })
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       const reader = new FileReader();
       reader.onloadend = () => {
         setAvatar(reader.result as string);
       };
       reader.readAsDataURL(file);
    }
  };

  if (!user) return <div className="text-center py-20">Please login first.</div>;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
      <Sidebar />
      <div className="flex-1 py-6 lg:px-8 min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">My Profile</h1>
        
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group cursor-pointer w-24 h-24">
              <img src={avatar} className="w-24 h-24 rounded-full border-4 border-slate-100 object-cover" alt="Profile" />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-white text-xs font-semibold">Upload</span>
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{user.username}</h2>
              <p className="text-slate-500">{user.points || 0} Points</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea 
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input 
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. New York, USA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Interests</label>
                <input 
                  type="text"
                  value={interests}
                  onChange={e => setInterests(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Technology, Design"
                />
              </div>
            </div>

            {success && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg font-medium">Profile successfully updated!</div>}

            <button 
              onClick={handleUpdate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
      <RightSidebar />
    </main>
  );
};
