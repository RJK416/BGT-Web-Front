'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken, getUserFromToken, isAuthenticated } from '@/utils/auth';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGames: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    winRate: 0,
    recentGames: [] as Array<{
      name: string;
      date: string;
      result: string;
      score: string;
    }>
  });
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/');
        return;
      }

      try {
        // Get user info from JWT token
        const userFromToken = getUserFromToken();
        
        if (!userFromToken) {
          // Invalid token, redirect to login
          removeAuthToken();
          router.push('/');
          return;
        }

        console.log('🔍 User from JWT token:', userFromToken);

        // Set user data from token (using the actual JWT payload structure)
        setUser({
          username: userFromToken.unique_name || userFromToken.sub || 'AdventureSeeker',
          email: userFromToken.email || 'adventure@realm.com',
          joinDate: '2024-01-15'
        });

        // Simulate loading user data
        setTimeout(() => {
          setStats({
            totalGames: 24,
            gamesPlayed: 18,
            gamesWon: 12,
            winRate: 66.7,
            recentGames: [
              { name: 'Catan', date: '2024-01-20', result: 'Won', score: '10-7-5' },
              { name: 'Ticket to Ride', date: '2024-01-18', result: 'Lost', score: '98-105' },
              { name: 'Pandemic', date: '2024-01-15', result: 'Won', score: 'Team Victory' },
              { name: 'Carcassonne', date: '2024-01-12', result: 'Won', score: '78-65' }
            ]
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to load user data:', error);
        // If there's an error, clear token and redirect to login
        removeAuthToken();
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    // Remove the JWT token
    removeAuthToken();
    // Redirect to login page
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-amber-400 text-lg">Loading your realm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-amber-400 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-amber-400 transform rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-20 h-20 border-2 border-amber-400 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-28 h-28 border-2 border-amber-400 transform rotate-45"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-purple-950/90 to-purple-900/90 backdrop-blur-sm border-b border-amber-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L4 6v8c0 4 3 6 8 8 5-2 8-4 8-8V6l-8-4z"/>
                  <circle cx="12" cy="10" r="2" fill="amber-300"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-amber-400">Board Games Tracker</h1>
                <p className="text-purple-200 text-sm">Chronicle Your Adventures</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-purple-200">Welcome, {user?.username}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30">
            <div className="flex items-center">
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-purple-200 text-sm font-medium">Total Games</p>
                <p className="text-2xl font-bold text-amber-400">{stats.totalGames}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30">
            <div className="flex items-center">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-purple-200 text-sm font-medium">Games Won</p>
                <p className="text-2xl font-bold text-green-400">{stats.gamesWon}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-purple-200 text-sm font-medium">Win Rate</p>
                <p className="text-2xl font-bold text-blue-400">{stats.winRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30">
            <div className="flex items-center">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-purple-200 text-sm font-medium">Games Played</p>
                <p className="text-2xl font-bold text-purple-400">{stats.gamesPlayed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Games */}
        <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-amber-400">Recent Games</h2>
            <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-medium rounded-lg transition-all duration-300">
              Add New Game
            </button>
          </div>
          
          <div className="space-y-4">
            {stats.recentGames.map((game, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-purple-900/50 rounded-lg border border-purple-700/30">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${game.result === 'Won' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <div>
                    <h3 className="text-amber-300 font-medium">{game.name}</h3>
                    <p className="text-purple-300 text-sm">{game.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    game.result === 'Won' 
                      ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                      : 'bg-red-500/20 text-red-300 border border-red-400/30'
                  }`}>
                    {game.result}
                  </span>
                  <p className="text-purple-300 text-sm mt-1">{game.score}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30 hover:border-amber-400/60 transition-all duration-300 text-left">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-amber-400 font-medium">Add New Game</h3>
                <p className="text-purple-300 text-sm">Record a new game session</p>
              </div>
            </div>
          </button>

          <button className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30 hover:border-amber-400/60 transition-all duration-300 text-left">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-green-400 font-medium">View Statistics</h3>
                <p className="text-purple-300 text-sm">Detailed game analytics</p>
              </div>
            </div>
          </button>

          <button className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30 hover:border-amber-400/60 transition-all duration-300 text-left">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-blue-400 font-medium">Game Library</h3>
                <p className="text-purple-300 text-sm">Manage your collection</p>
              </div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
} 