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

  // Sample board games data for the right sidebar
  const [boardGames] = useState([
    {
      id: 1,
      name: "Catan",
      category: "Strategy",
      players: "3-4",
      duration: "60-90 min",
      rating: 4.8,
      image: "🏰",
      status: "Owned"
    },
    {
      id: 2,
      name: "Ticket to Ride",
      category: "Family",
      players: "2-5",
      duration: "45-60 min",
      rating: 4.6,
      image: "🚂",
      status: "Owned"
    },
    {
      id: 3,
      name: "Pandemic",
      category: "Cooperative",
      players: "2-4",
      duration: "45-60 min",
      rating: 4.7,
      image: "🦠",
      status: "Wishlist"
    },
    {
      id: 4,
      name: "Carcassonne",
      category: "Tile Placement",
      players: "2-5",
      duration: "30-45 min",
      rating: 4.5,
      image: "🏛️",
      status: "Owned"
    },
    {
      id: 5,
      name: "Settlers of Catan",
      category: "Strategy",
      players: "3-4",
      duration: "60-90 min",
      rating: 4.9,
      image: "🌾",
      status: "Owned"
    },
    {
      id: 6,
      name: "Azul",
      category: "Abstract",
      players: "2-4",
      duration: "30-45 min",
      rating: 4.4,
      image: "🧩",
      status: "Wishlist"
    },
    {
      id: 7,
      name: "Wingspan",
      category: "Engine Building",
      players: "1-5",
      duration: "40-70 min",
      rating: 4.8,
      image: "🦅",
      status: "Owned"
    },
    {
      id: 8,
      name: "Gloomhaven",
      category: "RPG",
      players: "1-4",
      duration: "90-150 min",
      rating: 4.9,
      image: "⚔️",
      status: "Wishlist"
    }
  ]);

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

      {/* Main Content with Right Sidebar */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Content Area */}
          <div className="flex-1">
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
          </div>

          {/* Right Sidebar - Board Games List */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-amber-400">Board Games</h2>
                <button className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 rounded-lg transition-all duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search games..."
                    className="w-full pl-10 pr-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Games List */}
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {boardGames.map((game) => (
                  <div
                    key={game.id}
                    className="group bg-gradient-to-r from-purple-900/50 to-purple-800/50 hover:from-purple-800/60 hover:to-purple-700/60 rounded-lg p-4 border border-purple-700/30 hover:border-amber-400/50 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-lg"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Game Icon */}
                      <div className="text-3xl bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg p-2 flex-shrink-0">
                        {game.image}
                      </div>
                      
                      {/* Game Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-amber-300 font-semibold text-sm truncate group-hover:text-amber-200 transition-colors">
                          {game.name}
                        </h3>
                        <p className="text-purple-300 text-xs mb-1">{game.category}</p>
                        
                        {/* Game Details */}
                        <div className="flex items-center space-x-3 text-xs text-purple-400">
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {game.players}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {game.duration}
                          </span>
                        </div>
                        
                        {/* Rating and Status */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span className="text-amber-400 text-xs font-medium">{game.rating}</span>
                          </div>
                          
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            game.status === 'Owned' 
                              ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                              : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                          }`}>
                            {game.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Button */}
              <div className="mt-6 pt-4 border-t border-purple-700/30">
                <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105">
                  View All Games
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 