'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken, getUserFromToken, isAuthenticated } from '@/utils/auth';
import { API_CONFIG, apiRequest } from '@/config/api';
import Leaderboard from '@/components/Leaderboard';
import { useRef } from 'react';

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



  // Real board games data from API
  const [boardGames, setBoardGames] = useState([]);
  const [boardGamesLoading, setBoardGamesLoading] = useState(true);

  // Real user player data from API
  const [userPlayer, setUserPlayer] = useState<any>(null);
  const isGM = userPlayer?.role === 'GM';
  const [userPlayerLoading, setUserPlayerLoading] = useState(true);

  const router = useRouter();

  function CreateTournamentForm() {
    const [name, setName] = useState('');
    const [game, setGame] = useState('');
    const [tournamentDate, setTournamentDate] = useState('');
    const [maxMembers, setMaxMembers] = useState<number>(8);
    const [memberCount, setMemberCount] = useState<number>(0);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      setCreating(true);
      setMessage(null);
      try {
        const token = getAuthToken();
        // Ensure UTC date (input type="date" gives YYYY-MM-DD)
        const utcIsoDate = new Date(`${tournamentDate}T00:00:00Z`).toISOString();
        const body = {
          Name: name,
          Game: game,
          TournamentDate: utcIsoDate,
          MaxMembers: maxMembers,
          MemberCount: memberCount,
        };
        const res = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.CREATE_TOURNAMENT}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(res.error || res.message || 'Failed');
        setMessage(res.message || 'Tournament created');
        setName(''); setGame(''); setTournamentDate(''); setMaxMembers(8); setMemberCount(0);
      } catch (err: any) {
        setMessage(err.message || 'Failed to create tournament');
      } finally {
        setCreating(false);
      }
    };

    return (
      <form onSubmit={submit} className="space-y-4">
        {message && <div className="text-sm text-amber-300">{message}</div>}
        <div>
          <label className="block text-amber-300 text-sm mb-1">Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="w-full pl-3 pr-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100" required />
        </div>
        <div>
          <label className="block text-amber-300 text-sm mb-1">Game</label>
          <input value={game} onChange={e=>setGame(e.target.value)} className="w-full pl-3 pr-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100" required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-amber-300 text-sm mb-1">Date</label>
            <input type="date" value={tournamentDate} onChange={e=>setTournamentDate(e.target.value)} className="w-full pl-3 pr-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100" required />
          </div>
          <div>
            <label className="block text-amber-300 text-sm mb-1">Max Members</label>
            <input type="number" min={1} value={maxMembers} onChange={e=>setMaxMembers(parseInt(e.target.value||'0'))} className="w-full pl-3 pr-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100" required />
          </div>
          <div>
            <label className="block text-amber-300 text-sm mb-1">Initial Members</label>
            <input type="number" min={0} value={memberCount} onChange={e=>setMemberCount(parseInt(e.target.value||'0'))} className="w-full pl-3 pr-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100" required />
          </div>
        </div>
        <button disabled={creating} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-medium rounded-lg">{creating? 'Creating...' : 'Create Tournament'}</button>
      </form>
    );
  }

  // Fetch board games from API
  const fetchBoardGames = async () => {
    try {
      setBoardGamesLoading(true);
      const response = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_BOARDGAMES}?page=1&pageSize=10`, {
        method: 'GET',
      });

      if (response.ok && response.status === 200) {
        setBoardGames(response.data?.items || []);
      } else {
        console.error('Failed to fetch board games:', response);
        setBoardGames([]);
      }
    } catch (error) {
      console.error('Error fetching board games:', error);
      setBoardGames([]);
    } finally {
      setBoardGamesLoading(false);
    }
  };

  // Fetch user player data from API
  const fetchUserPlayer = async () => {
    try {
      setUserPlayerLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        console.error('No auth token found');
        setUserPlayer(null);
        return;
      }

      const response = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_USER_PLAYER}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('User player response:', response);

      if (response.ok && response.status === 200) {
        setUserPlayer(response.data);
        console.log('User player data set:', response.data);
      } else {
        console.error('Failed to fetch user player:', response);
        setUserPlayer(null);
      }
    } catch (error) {
      console.error('Error fetching user player:', error);
      setUserPlayer(null);
    } finally {
      setUserPlayerLoading(false);
    }
  };

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
        console.log('🔍 Available JWT claims:', Object.keys(userFromToken));
        console.log('🔍 name claim:', userFromToken.name);
        console.log('🔍 unique_name claim:', userFromToken.unique_name);
        console.log('🔍 sub claim:', userFromToken.sub);
        console.log('🔍 email claim:', userFromToken.email);

        // Set user data from token (using the actual JWT payload structure)
        // Backend stores username in 'name' claim, user ID in 'sub' claim, email in 'email' claim
        setUser({
          username: userFromToken.name || userFromToken.unique_name || userFromToken.sub || 'User',
          email: userFromToken.email || 'user@realm.com',
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

        // Fetch board games data
        fetchBoardGames();
        
        // Fetch user player data
        fetchUserPlayer();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 relative overflow-hidden">
      {/* Cosmic Background */}
      <div className="absolute inset-0">
        {/* Stars */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Star Clusters */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-cyan-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-32 left-16 w-2 h-2 bg-cyan-200 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-28 left-24 w-3 h-3 bg-cyan-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.8s' }} />
        
        <div className="absolute top-40 right-32 w-3 h-3 bg-blue-300 rounded-full opacity-70 animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-52 right-28 w-2 h-2 bg-blue-200 rounded-full opacity-90 animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-44 right-36 w-4 h-4 bg-blue-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '2.1s' }} />
        
        <div className="absolute bottom-32 left-40 w-2 h-2 bg-purple-300 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.8s' }} />
        <div className="absolute bottom-40 left-36 w-3 h-3 bg-purple-200 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.7s' }} />
        <div className="absolute bottom-36 left-44 w-1 h-1 bg-purple-400 rounded-full opacity-100 animate-pulse" style={{ animationDelay: '1.4s' }} />
        
        {/* Cosmic Dust/Nebula */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-purple-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-radial from-blue-400/8 via-cyan-400/4 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        
        {/* Shooting Stars */}
        <div className="absolute top-20 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '2.5s' }} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-cyan-300 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '4s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-blue-300 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1.5s' }} />
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
                onClick={() => router.push('/settings')}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-medium rounded-lg transition-all duration-300"
              >
                Settings
              </button>
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
              <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border-4 border-sky-200/70 shadow-lg shadow-sky-200/20">
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

              <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border-4 border-sky-200/70 shadow-lg shadow-sky-200/20">
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

              <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border-4 border-sky-200/70 shadow-lg shadow-sky-200/20">
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

              <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border-4 border-sky-200/70 shadow-lg shadow-sky-200/20">
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

            {/* Leaderboard */}
            <Leaderboard limit={10} showPagination={true} showSearch={true} className="mb-8 border-4 border-sky-200/70 shadow-lg shadow-sky-200/20" />

            {/* GM: Create Tournament Panel */}
            {isGM && (
              <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border-4 border-amber-400/40 shadow-lg shadow-amber-400/20 mb-8">
                <h2 className="text-xl font-bold text-amber-400 mb-4">Create Tournament</h2>
                <CreateTournamentForm />
              </div>
            )}

            {/* Your Player Card */}
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border-4 border-sky-200/70 shadow-lg shadow-sky-200/20 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-amber-400">Your Profile</h2>
                <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-medium rounded-lg transition-all duration-300">
                  Edit Profile
                </button>
              </div>
              
              <div className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 rounded-xl p-6 border border-amber-400/20">
                <div className="flex items-center space-x-6">
                  {/* Profile Picture */}
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-purple-900">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-2 border-purple-900">
                      <span className="text-xs font-bold text-white">G</span>
                    </div>
                      </div>

                  {/* Player Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <h3 className="text-2xl font-bold text-amber-300">
                        {userPlayer?.nickname || user?.username || 'User'}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-300 border border-orange-400/30">
                        {userPlayer?.guild || 'Elite Guild'}
                      </span>
                    </div>

                    {/* Level and XP Bar */}
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="text-xl font-bold text-amber-400">
                        LVL {userPlayer?.level || 1}
                      </span>
                      <div className="flex-1 bg-purple-900/50 rounded-full h-4 overflow-hidden">
                        {userPlayer ? (() => {
                          // Calculate XP percentage
                          const xpForCurrentLevel = userPlayer.level * 1000;
                          const xpForNextLevel = (userPlayer.level + 1) * 1000;
                          const xpInCurrentLevel = userPlayer.xp - xpForCurrentLevel;
                          const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
                          const xpPercentage = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)));
                          
                          return (
                            <>
                              <div 
                                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                                style={{ width: `${xpPercentage}%` }}
                              ></div>
                            </>
                          );
                        })() : (
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                            style={{ width: '65%' }}
                          ></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-amber-300">
                        {userPlayer ? (() => {
                          const xpForCurrentLevel = userPlayer.level * 1000;
                          const xpForNextLevel = (userPlayer.level + 1) * 1000;
                          const xpInCurrentLevel = userPlayer.xp - xpForCurrentLevel;
                          const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
                          const xpPercentage = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)));
                          return `${xpPercentage}%`;
                        })() : '65%'}
                      </span>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-400">{userPlayer?.matchesPlayed || stats.gamesPlayed}</div>
                        <div className="text-xs text-purple-300">Games Played</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{userPlayer?.wins || stats.gamesWon}</div>
                        <div className="text-xs text-purple-300">Games Won</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{userPlayer ? Math.round(userPlayer.winRate * 100) : stats.winRate}%</div>
                        <div className="text-xs text-purple-300">Win Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="flex flex-col space-y-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-400">+{userPlayer?.totalScore || 0}</div>
                      <div className="text-xs text-purple-300">Total Points</div>
                    </div>
                    <div className="flex space-x-2">
                      {userPlayer?.mvps > 0 && (
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center" title={`${userPlayer.mvps} MVP${userPlayer.mvps > 1 ? 's' : ''}`}>
                          <span className="text-yellow-900 text-sm">⭐</span>
                        </div>
                      )}
                      {userPlayer?.tournamentsWon > 0 && (
                        <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center" title={`${userPlayer.tournamentsWon} Tournament Win${userPlayer.tournamentsWon > 1 ? 's' : ''}`}>
                          <span className="text-yellow-100 text-sm">👑</span>
                        </div>
                      )}
                      {userPlayer?.wins > 0 && (
                        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center" title={`${userPlayer.wins} Win${userPlayer.wins > 1 ? 's' : ''}`}>
                          <span className="text-white text-sm">🏆</span>
                        </div>
                      )}
                      {(!userPlayer || (userPlayer.mvps === 0 && userPlayer.tournamentsWon === 0 && userPlayer.wins === 0)) && (
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center" title="No achievements yet">
                          <span className="text-gray-300 text-sm">🎯</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <button className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border-4 border-sky-200/70 hover:border-sky-200/90 shadow-lg shadow-sky-200/20 hover:shadow-sky-200/30 transition-all duration-300 text-left">
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

              <button className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border-4 border-sky-200/70 hover:border-sky-200/90 shadow-lg shadow-sky-200/20 hover:shadow-sky-200/30 transition-all duration-300 text-left">
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

              <button className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border-4 border-sky-200/70 hover:border-sky-200/90 shadow-lg shadow-sky-200/20 hover:shadow-sky-200/30 transition-all duration-300 text-left">
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
          <div className="w-80 flex-shrink-0 relative">
            {/* Stardust around Board Games */}
            <div className="absolute -top-4 -left-4 w-6 h-6 bg-cyan-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.8s' }} />
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-300 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-8 -left-6 w-2 h-2 bg-purple-300 rounded-full opacity-70 animate-pulse" style={{ animationDelay: '2.2s' }} />
            <div className="absolute top-16 -right-4 w-4 h-4 bg-cyan-200 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.3s' }} />
            <div className="absolute top-24 -left-2 w-1 h-1 bg-white rounded-full opacity-90 animate-pulse" style={{ animationDelay: '1.8s' }} />
            <div className="absolute top-32 -right-6 w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '2.7s' }} />
            
            {/* Floating stardust particles */}
            <div className="absolute top-12 left-2 w-1 h-1 bg-cyan-400 rounded-full opacity-80 animate-ping" style={{ animationDuration: '3s', animationDelay: '1.2s' }} />
            <div className="absolute top-20 right-1 w-1 h-1 bg-purple-400 rounded-full opacity-70 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '2.8s' }} />
            <div className="absolute top-28 left-1 w-1 h-1 bg-blue-300 rounded-full opacity-90 animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
            
            {/* Cosmic dust near board games */}
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-gradient-radial from-cyan-500/5 via-blue-500/3 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
            <div className="absolute -top-4 -right-8 w-24 h-24 bg-gradient-radial from-purple-500/6 via-cyan-500/2 to-transparent rounded-full blur-xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '2.5s' }} />
            
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border-4 border-sky-200/70 shadow-lg shadow-sky-200/20 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-amber-400">Board Games</h2>
                <button 
                  onClick={() => console.log('Add game clicked')}
                  className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 rounded-lg transition-all duration-300"
                >
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
                {boardGamesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mr-2"></div>
                    <p className="text-amber-400 text-lg">Loading board games...</p>
                  </div>
                ) : boardGames.length > 0 ? boardGames.map((game) => (
                  <div
                    key={game.id}
                    className="group bg-gradient-to-r from-purple-900/50 to-purple-800/50 hover:from-purple-800/60 hover:to-purple-700/60 rounded-lg p-4 border-4 border-sky-200/40 hover:border-sky-200/70 shadow-md shadow-sky-200/10 hover:shadow-sky-200/20 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-lg"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Game Icon */}
                      <div className="text-3xl bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg p-2 flex-shrink-0">
🎲
                      </div>
                      
                      {/* Game Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-amber-300 font-semibold text-sm truncate group-hover:text-amber-200 transition-colors">
                          {game.name}
                        </h3>
                        <p className="text-purple-300 text-xs mb-1">{game.description || 'Board Game'}</p>
                        
                        {/* Game Details */}
                        <div className="flex items-center space-x-3 text-xs text-purple-400">
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {game.minPlayers}-{game.maxPlayers} players
                          </span>
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Difficulty: {game.diff}
                          </span>
                        </div>
                        
                        {/* Status */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span className="text-amber-400 text-xs font-medium">{game.recentGames} recent</span>
                          </div>
                          
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            game.ownerCount > 0 
                              ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                              : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                          }`}>
                            {game.ownerCount > 0 ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <div className="text-purple-300 text-lg">No board games available</div>
                    <div className="text-purple-400 text-sm mt-2">Games will appear here as they are added</div>
                  </div>
                )}
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