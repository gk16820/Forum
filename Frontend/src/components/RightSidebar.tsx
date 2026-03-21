import { useState, useEffect } from 'react';

export const RightSidebar = () => {
  const [topUsers, setTopUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/users/top')
      .then(res => res.json())
      .then(data => setTopUsers(data))
      .catch(console.error);
  }, []);

  return (
    <aside className="hidden xl:block w-80 pl-8 py-6 sticky top-16 h-[calc(100vh-4rem)]">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold text-primary mb-4 flex items-center justify-between">
          Top Contributors
          <span className="text-xs text-brand-600 cursor-pointer hover:underline">View All</span>
        </h3>
        <div className="space-y-4">
          {topUsers.length === 0 ? (
            <p className="text-sm text-secondary italic">No activity yet.</p>
          ) : topUsers.map((user, i) => (
            <div key={user.username} className="flex items-center gap-3">
              <div className="relative">
                <img src={user.avatar} alt="" className="h-10 w-10 rounded-full border border-slate-200 object-cover" />
                {i === 0 && <div className="absolute -top-1 -right-1 text-xs bg-yellow-400 rounded-full w-4 h-4 flex items-center justify-center border-2 border-white text-[10px]">⭐</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary truncate">{user.username}</p>
                <p className="text-xs text-secondary truncate">{user.role}</p>
              </div>
              <div className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-md">
                {user.points} pts
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
