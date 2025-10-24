"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authStorage } from '@/lib/auth-api';

interface ProfileDropdownProps {
  username?: string;
  onLogout?: () => void;
  inline?: boolean; // Whether to render inline (for headers) or as floating element
}

export default function ProfileDropdown({ username: propUsername, onLogout: propOnLogout, inline = false }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState(propUsername || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on a news page (which has its own integrated profile dropdown)
  const isOnNewsPage = pathname?.startsWith('/news/');

  useEffect(() => {
    // Mark that we're on the client
    setIsClient(true);

    // Check authentication on client side
    const authenticated = authStorage.isAuthenticated();
    setIsAuthenticated(authenticated);

    if (authenticated && !propUsername) {
      const token = authStorage.getToken();
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const decoded = JSON.parse(jsonPayload);
          if (decoded && decoded.name) {
            setUsername(decoded.name);
          }
        } catch (error) {
          console.error('Error decoding JWT:', error);
        }
      }
    }
  }, [propUsername]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    if (propOnLogout) {
      propOnLogout();
    } else {
      // Default logout behavior
      authStorage.removeToken();
      setIsAuthenticated(false);
      router.push('/');
    }
    setIsOpen(false);
  };

  // Don't render until we've determined client state, or if we're on news pages and not inline (handled in header)
  if (!isClient || !isAuthenticated || (isOnNewsPage && !inline)) {
    return null;
  }

  return (
    <div className={inline ? "relative" : "fixed top-4 right-4 z-[60]"} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-all duration-200 md:px-4"
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs md:text-sm font-medium">
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <span className="text-gray-900 font-medium text-sm hidden sm:block">
            {username || 'User'}
          </span>
        </div>
        <svg
          className={`w-3 h-3 md:w-4 md:h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute ${inline ? 'right-0' : 'right-0'} mt-2 w-48 md:w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[60]`}>
          <div className="px-3 md:px-4 py-2 border-b border-gray-100">
            <p className="text-xs md:text-sm text-gray-600">Welcome back!</p>
            <p className="text-xs md:text-sm font-medium text-gray-900">{username || 'User'}</p>
          </div>

          <button
            onClick={() => handleNavigation('/dashboard')}
            className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleNavigation('/dashboard/news')}
            className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span>News</span>
          </button>

          <button
            onClick={() => handleNavigation('/dashboard/topics')}
            className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Topics</span>
          </button>

          <button
            onClick={() => handleNavigation('/dashboard/companies')}
            className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Companies</span>
          </button>

          <button
            onClick={() => handleNavigation('/dashboard/account')}
            className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Account</span>
          </button>

          <div className="border-t border-gray-100 my-1"></div>

          <button
            onClick={handleLogout}
            className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center space-x-2"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}