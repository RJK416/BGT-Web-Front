'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_CONFIG, apiRequest } from '@/config/api';
import UserProfileCard from './UserProfileCard';

interface LeaderboardPlayer {
  id: number;
  nickname: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  matchesPlayed: number;
  wins: number;
  mvps: number;
  tournamentsWon: number;
  winRate: number;
  totalScore: number;
  guild?: string;
}

interface LeaderboardProps {
  limit?: number;
  showTitle?: boolean;
  className?: string;
  showPagination?: boolean;
  showSearch?: boolean;
}

export default function Leaderboard({ limit = 10, showTitle = true, className = '', showPagination = false, showSearch = true }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<{url: string, nickname: string} | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: limit,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const fetchLeaderboard = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Fetching leaderboard data...');
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: limit.toString(),
        sortBy: 'TotalScore',
        sortDescending: 'true'
      });
      
      const response = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_LEADERBOARD}?${params}`, {
        method: 'GET',
      });

      console.log('🔍 Leaderboard response:', response);

      if (response.ok && response.status === 200) {
        const data = response.data;
        setLeaderboard(data.players || []);
        setPagination({
          page: data.page || 1,
          pageSize: data.pageSize || limit,
          totalCount: data.totalCount || 0,
          totalPages: data.totalPages || 0,
          hasNextPage: data.hasNextPage || false,
          hasPreviousPage: data.hasPreviousPage || false
        });
        console.log('🔍 Leaderboard data set:', data);
      } else {
        console.error('🔍 Failed to fetch leaderboard:', response);
        setError(response.error || response.message || 'Failed to fetch leaderboard');
        setLeaderboard([]);
      }
    } catch (error) {
      console.error('🔍 Error fetching leaderboard:', error);
      setError(error instanceof Error ? error.message : 'Error fetching leaderboard');
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [limit]);

  // Filter leaderboard based on search term
  const filteredLeaderboard = useMemo(() => {
    if (!searchTerm.trim()) return leaderboard;
    
    return leaderboard.filter(player =>
      player.nickname.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leaderboard, searchTerm]);

  // Handle player click to show profile
  const handlePlayerClick = (nickname: string) => {
    setSelectedUsername(nickname);
    setIsProfileCardOpen(true);
  };

  // Handle profile card close
  const handleProfileCardClose = () => {
    setIsProfileCardOpen(false);
    setSelectedUsername(null);
  };

  const handleAvatarClick = (avatarUrl: string, nickname: string) => {
    setSelectedAvatar({ url: avatarUrl, nickname });
    setIsAvatarModalOpen(true);
  };

  const handleAvatarModalClose = () => {
    setIsAvatarModalOpen(false);
    setSelectedAvatar(null);
  };

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30 ${className}`}>
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-amber-400">Top Players</h2>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
          <span className="ml-3 text-amber-400">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30 ${className}`}>
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-amber-400">Top Players</h2>
          </div>
        )}
        <div className="text-center py-8">
          <div className="text-red-400 text-lg mb-2">Error loading leaderboard</div>
          <div className="text-purple-300 text-sm">{error}</div>
          <button 
            onClick={() => fetchLeaderboard(1)}
            className="mt-4 px-4 py-2 bg-amber-500 text-purple-900 rounded-lg hover:bg-amber-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-amber-400/30 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-amber-400">Top Players</h2>
        </div>
      )}

      {/* Search Bar */}
      {showSearch && (
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-300 hover:text-amber-400 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-purple-300">
              {filteredLeaderboard.length} player{filteredLeaderboard.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        {filteredLeaderboard.length > 0 ? filteredLeaderboard.map((player, index) => {
          // Derive progress directly from XP to avoid backend level curve mismatch
          const xp = Math.max(0, player.xp || 0);
          const levelBase = Math.floor(xp / 1000) * 1000;
          const xpInCurrentLevel = xp - levelBase;
          const xpPercentage = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / 1000) * 100)));

          return (
            <div 
              key={player.id} 
              className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 rounded-xl p-3 sm:p-4 border border-amber-400/20 hover:border-amber-400/40 transition-all duration-300 cursor-pointer"
              onClick={() => handlePlayerClick(player.nickname)}
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                {/* Rank */}
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-900">{index + 1}</span>
                </div>
                
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400">
                    {player.avatarUrl ? (
                      <img
                        src={player.avatarUrl}
                        alt={player.nickname}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the row click
                          handleAvatarClick(player.avatarUrl!, player.nickname);
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center ${player.avatarUrl ? 'hidden' : ''}`}>
                      <span className="text-lg font-bold text-purple-900">
                        {player.nickname.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {player.guild && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-2 border-purple-900">
                      <span className="text-xs font-bold text-white">G</span>
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-amber-300 truncate">
                      {player.nickname}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                      player.guild 
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                        : 'bg-red-500/20 text-red-300 border border-red-400/30'
                    }`}>
                      {player.guild || "No guild"}
                    </span>
                  </div>

                  {/* Level and XP Bar */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm font-bold text-amber-400">
                      LVL {player.level}
                    </span>
                    <div className="flex-1 bg-purple-900/60 rounded-full h-2 sm:h-3 overflow-hidden border-2 border-amber-400/60">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                        style={{ width: `${xpPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-amber-300">
                      {xpPercentage}%
                    </span>
                  </div>
                </div>

                {/* Achievements and Score */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Achievement Icons */}
                  <div className="flex gap-1">
                    {player.mvps > 0 && (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-500 rounded-full flex items-center justify-center" title={`${player.mvps} MVP${player.mvps > 1 ? 's' : ''}`}>
                        <span className="text-yellow-900 text-sm">⭐</span>
                      </div>
                    )}
                    {player.tournamentsWon > 0 && (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-600 rounded-full flex items-center justify-center" title={`${player.tournamentsWon} Tournament Win${player.tournamentsWon > 1 ? 's' : ''}`}>
                        <span className="text-yellow-100 text-sm">👑</span>
                      </div>
                    )}
                    {player.wins > 0 && (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-800 rounded-full flex items-center justify-center" title={`${player.wins} Win${player.wins > 1 ? 's' : ''}`}>
                        <span className="text-white text-sm">🏆</span>
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-bold text-amber-400">
                      +{player.totalScore}
                    </div>
                    <div className="text-[10px] sm:text-xs text-purple-300">
                      points
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-8">
            {searchTerm ? (
              <>
                <div className="text-purple-300 text-lg">No players found</div>
                <div className="text-purple-400 text-sm mt-2">No players match "{searchTerm}"</div>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-amber-500 text-purple-900 rounded-lg hover:bg-amber-400 transition-colors"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <div className="text-purple-300 text-lg">No leaderboard data available</div>
                <div className="text-purple-400 text-sm mt-2">Players will appear here as they play games</div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {showPagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-purple-300">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} players
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchLeaderboard(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
              className="px-3 py-2 bg-purple-800/50 border border-amber-400/30 rounded-lg text-amber-300 hover:bg-purple-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i;
                if (pageNum > pagination.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchLeaderboard(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-all ${
                      pageNum === pagination.page
                        ? 'bg-amber-500 text-purple-900 font-bold'
                        : 'bg-purple-800/50 border border-amber-400/30 text-amber-300 hover:bg-purple-700/50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => fetchLeaderboard(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-2 bg-purple-800/50 border border-amber-400/30 rounded-lg text-amber-300 hover:bg-purple-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* User Profile Card */}
      {selectedUsername && (
        <UserProfileCard
          username={selectedUsername}
          isOpen={isProfileCardOpen}
          onClose={handleProfileCardClose}
        />
      )}

      {/* Avatar Modal */}
      {isAvatarModalOpen && selectedAvatar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-2xl p-6 max-w-md w-full border border-amber-400/30">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-amber-300">
                {selectedAvatar.nickname}'s Avatar
              </h3>
              <button
                onClick={handleAvatarModalClose}
                className="text-purple-300 hover:text-amber-400 transition-colors p-2 hover:bg-purple-800/50 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Avatar Image */}
            <div className="flex justify-center mb-4">
              <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl">
                <img
                  src={selectedAvatar.url}
                  alt={`${selectedAvatar.nickname}'s avatar`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center hidden">
                  <span className="text-6xl font-bold text-purple-900">
                    {selectedAvatar.nickname.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="text-center">
              <p className="text-purple-200 text-sm">
                Click outside or press ESC to close
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
