'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/LoginModal';

interface Player {
  id: number;
  nickname: string;
  guild: string | null;
  level: number;
  xp: number;
  xpToNext: number;
  achievements: {
    mvp: boolean;
    bestPlayer: boolean;
    tournamentWinner: boolean;
  };
  score: number;
  profilePicture: string;
}

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();

  // Mock data for the leaderboard
  const players: Player[] = [
    {
      id: 1,
      nickname: "DragonSlayer",
      guild: "Ultra Chad Guild",
      level: 12,
      xp: 2700,
      xpToNext: 10000,
      achievements: { mvp: true, bestPlayer: true, tournamentWinner: false },
      score: 14,
      profilePicture: "/api/placeholder/60/60"
    },
    {
      id: 2,
      nickname: "ChessMaster",
      guild: "Clock Master Guild",
      level: 11,
      xp: 7500,
      xpToNext: 10000,
      achievements: { mvp: false, bestPlayer: false, tournamentWinner: true },
      score: 16,
      profilePicture: "/api/placeholder/60/60"
    },
    {
      id: 3,
      nickname: "BoardGameKing",
      guild: null,
      level: 9,
      xp: 5200,
      xpToNext: 10000,
      achievements: { mvp: false, bestPlayer: true, tournamentWinner: false },
      score: 15,
      profilePicture: "/api/placeholder/60/60"
    }
  ];

  const filteredPlayers = players.filter(player =>
    player.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.guild && player.guild.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const xpPercentage = (xp: number, xpToNext: number) => Math.round((xp / xpToNext) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-25">
        {/* Medieval patterns */}
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-amber-400 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-amber-400 transform rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-20 h-20 border-2 border-amber-400 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-28 h-28 border-2 border-amber-400 transform rotate-45"></div>
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-amber-400 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-amber-300 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="flex justify-between items-center mb-8">
          {/* Login/Registration Button */}
          <button
            onClick={() => setShowLogin(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Login / Register
          </button>

          {/* Empty space for balance */}
          <div></div>
        </div>

        {/* Main Title */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-amber-600 mb-4 tracking-wider">
            LEADERBOARD
          </h1>
          <p className="text-purple-200 text-xl">
            Top Players & Guilds
          </p>
        </div>

        {/* Leaderboard */}
        <div className="max-w-4xl mx-auto">
          {/* Search Bar - moved closer to leaderboard */}
          <div className="flex justify-end mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search players or guilds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all w-80"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-amber-400/30">
            {/* Leaderboard Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-amber-400 mb-2">
                Player Rankings
              </h2>
              <p className="text-purple-200">
                Compete for the top spot!
              </p>
            </div>

            {/* Player Cards */}
            <div className="space-y-4">
              {filteredPlayers.map((player, index) => (
                <div key={player.id} className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 rounded-xl p-6 border border-amber-400/20 hover:border-amber-400/40 transition-all duration-300">
                  <div className="flex items-center space-x-6">
                    {/* Profile Picture */}
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-purple-900">
                          {player.nickname.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {/* Guild Shield Overlay */}
                      {player.guild && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-2 border-purple-900">
                          <span className="text-xs font-bold text-white">G</span>
                        </div>
                      )}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-xl font-bold text-amber-300">
                          {player.nickname}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          player.guild 
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                            : 'bg-red-500/20 text-red-300 border border-red-400/30'
                        }`}>
                          {player.guild || "No guild member"}
                        </span>
                      </div>

                      {/* Level and XP Bar */}
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-bold text-amber-400">
                          LVL {player.level}
                        </span>
                        <div className="flex-1 bg-purple-900/50 rounded-full h-4 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                            style={{ width: `${xpPercentage(player.xp, player.xpToNext)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-amber-300">
                          {xpPercentage(player.xp, player.xpToNext)}%
                        </span>
                      </div>
                    </div>

                    {/* Achievements and Score */}
                    <div className="flex items-center space-x-4">
                      {/* Achievement Icons */}
                      <div className="flex space-x-2">
                        {player.achievements.mvp && (
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center" title="MVP">
                            <span className="text-yellow-900 text-lg">⭐</span>
                          </div>
                        )}
                        {player.achievements.bestPlayer && (
                          <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center" title="Best Player">
                            <span className="text-white text-lg">🏆</span>
                          </div>
                        )}
                        {player.achievements.tournamentWinner && (
                          <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center" title="Tournament Winner">
                            <span className="text-yellow-100 text-lg">👑</span>
                          </div>
                        )}
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-amber-400">
                          +{player.score}
                        </div>
                        <div className="text-sm text-purple-300">
                          points
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            {/* Close button */}
            <button
              onClick={() => setShowLogin(false)}
              className="absolute -top-4 -right-4 z-10 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>
            {/* Login form frame only */}
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-amber-400/30 relative">
              {/* Decorative columns */}
              <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full"></div>
              <div className="absolute -right-2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full"></div>
              
              {/* Curtain-like form header */}
              <div className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-t-2xl"></div>
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-b-2xl"></div>
              
              {/* LoginModal component without background */}
              <div className="relative z-10">
                <LoginModal />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 