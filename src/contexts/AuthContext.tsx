'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RedditUser, RedditToken } from '@/types';
import { getToken, getValidToken, clearToken, getRedditAuthUrl, getCurrentUser } from '@/lib/reddit';

interface AuthContextType {
  user: RedditUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: () => void;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RedditUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      const token = await getValidToken();
      if (token) {
        setAccessToken(token);

        // Try to get cached user first
        const cachedUser = localStorage.getItem('reddit_user');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        } else {
          const userData = await getCurrentUser(token);
          setUser(userData);
          localStorage.setItem('reddit_user', JSON.stringify(userData));
        }
      } else {
        setUser(null);
        setAccessToken(null);
      }
    } catch (error) {
      console.error('Auth refresh error:', error);
      setUser(null);
      setAccessToken(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await refreshAuth();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = () => {
    window.location.href = getRedditAuthUrl();
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        accessToken,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
