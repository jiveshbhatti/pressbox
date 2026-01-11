'use client';

import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏟️</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Pressbox
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">u/{user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg font-medium transition-colors"
            >
              Sign in with Reddit
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
