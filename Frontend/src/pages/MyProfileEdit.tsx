import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';
import { ArrowLeft, Camera, CheckCircle } from 'lucide-react';
import { DomainSelect } from '../components/DomainSelect';

export const MyProfileEdit = () => {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();

  const [avatar, setAvatar] = useState(user?.avatar || '/Blank profile.png');
  const [description, setDescription] = useState(user?.description || '');
  const [role, setRole] = useState(user?.role || '');
  const [domain, setDomain] = useState<string[]>(Array.isArray(user?.domain) ? user?.domain : (user?.domain ? [user?.domain] : []));
  const [interests, setInterests] = useState(user?.interests || '');
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    if (!role.trim() || domain.length === 0) {
      setError('Role and Domain are required.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const res = await fetch('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar, description, role, domain, interests })
      });
      const data = await res.json();
      if (res.ok) {
        if (token) {
          login(token, data.user);
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            navigate('/my-profile');
          }, 1500);
        }
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!user) return <div className="text-center py-20">Please login first.</div>;

  const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 bg-white";
  const labelClass = "block text-sm font-semibold text-slate-600 mb-2";

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 py-8 lg:px-10 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/my-profile')}
            className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-400 hover:text-slate-900 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Profile</h1>
            <p className="text-slate-400 text-sm mt-0.5">Update your public profile information</p>
          </div>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Avatar Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-6 shadow-sm">
            <div className="relative group cursor-pointer w-24 h-24 shrink-0">
              <img
                src={avatar}
                className="w-24 h-24 rounded-full border-4 border-slate-100 object-cover"
                alt="Profile"
              />
              <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white mb-1" />
                <span className="text-white text-[10px] font-bold">CHANGE</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user.username}</h2>
              <p className="text-slate-400 text-sm mt-1">{user.points || 0} Points</p>
              <p className="text-[11px] text-slate-400 mt-2">Click on the photo to update it</p>
            </div>
          </div>

          {/* Professional Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">Professional Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>
                  Role <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Frontend Developer"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Domain <span className="text-red-400">*</span>
                </label>
                <DomainSelect
                  value={domain}
                  onChange={setDomain}
                />
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">About</h3>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={`${inputClass} resize-none`}
                placeholder="Tell the community about yourself..."
              />
            </div>
            <div>
              <label className={labelClass}>Interests</label>
              <input
                type="text"
                value={interests}
                onChange={e => setInterests(e.target.value)}
                className={inputClass}
                placeholder="e.g. React, Machine Learning, UI Design"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">Separate interests with commas</p>
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Profile updated! Redirecting…
            </div>
          )}

          <button
            onClick={handleUpdate}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
      <RightSidebar />
    </main>
  );
};
