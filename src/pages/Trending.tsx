import { Sidebar } from '../components/Sidebar';
import { RightSidebar } from '../components/RightSidebar';

export const Trending = () => {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
      <Sidebar />
      <div className="flex-1 py-6 lg:px-8 min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Trending</h1>
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="text-4xl mb-4">🔥</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Trending discussions coming soon!</h2>
          <p className="text-slate-500">We are currently gathering upvote data to calculate the most trending discussions on the forum.</p>
        </div>
      </div>
      <RightSidebar />
    </main>
  );
};
