'use client';

import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
            <span className="text-white text-xl">🏟️</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900">
            Pressbox
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-10 h-10 rounded-2xl bg-slate-100 animate-pulse" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contributor</span>
                <span className="text-sm font-bold text-slate-900">u/{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 hover:bg-slate-900 hover:text-white transition-all group/logout"
                title="Sign out"
              >
                <span className="text-lg group-hover/logout:scale-110 transition-transform">🚪</span>
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-slate-900/20 active:scale-95"
            >
              Sign in with Reddit
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
