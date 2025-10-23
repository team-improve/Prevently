import { lusitana } from '@/app/ui/fonts';
import { authStorage } from '@/lib/auth-api';
import { useState, useEffect } from 'react';

interface DashboardPageProps {
  onLogout: () => void;
}

function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export default function DashboardPage({ onLogout }: DashboardPageProps) {
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded && decoded.name) {
        setUsername(decoded.name);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Dashboard Navigation */}
      <nav className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex items-center">
          <h1 className={`${lusitana.className} text-2xl font-bold text-gray-900`}>Prevently</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">Welcome back{username ? `, ${username}` : ''}!</span>
          <button
            onClick={onLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Economic Intelligence
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Dashboard</span>
          </h1>
        </div>

        {/* Dashboard Cards */}
        <p className="text-gray-900 text-3xl font-semibold">Imagine some cool text here (Lore Ipsum)</p>
        <p className="mt-4 text-gray-600">This dashboard is under construction, let the Minecraft builders to their job.</p>
      </main>
    </div>
  );
}