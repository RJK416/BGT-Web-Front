'use client';

import { useState, useEffect, useCallback, useMemo, CSSProperties } from 'react';
import { API_CONFIG, apiRequest } from '@/config/api';
import UserProfileCard from './UserProfileCard';
import { tavernPalette } from '@/styles/tavernTheme';

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
  style?: CSSProperties;
}

export default function Leaderboard({ limit = 10, showTitle = true, className = '', showPagination = false, showSearch = true, style }: LeaderboardProps) {
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

  const baseContainerStyle: CSSProperties = {
    backgroundImage: tavernPalette.panelGradient,
    border: `1px solid ${tavernPalette.border}`,
    boxShadow: `0 20px 60px ${tavernPalette.shadow}`,
    color: tavernPalette.parchment
  };

  const mergedContainerStyle: CSSProperties = {
    ...baseContainerStyle,
    ...style
  };

  if (isLoading) {
    return (
      <div className={`medieval-panel p-6 ${className} relative overflow-hidden`}
        style={mergedContainerStyle}
      >
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#F4EBD0]">Top Players</h2>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
          <span className="ml-3 text-orange-300">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`medieval-panel p-6 ${className} relative overflow-hidden`}
        style={mergedContainerStyle}
      >
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#F4EBD0]">Top Players</h2>
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
    <div className={`medieval-panel p-4 sm:p-6 relative overflow-hidden ${className}`}
      style={mergedContainerStyle}
    >
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#F4EBD0]">Top Players</h2>
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
              className="w-full pl-10 pr-4 py-3 bg-[#2A1D12]/90 border border-[#9C6B3E]/50 rounded-lg text-[#F4EBD0] placeholder-[#B6AA96] focus:outline-none focus:ring-2 focus:ring-[#E7B45D]/60 focus:border-[#E7B45D]/40 transition-all"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-amber-400 hover:text-orange-400 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
        <div className="mt-2 text-sm text-[#B6AA96]">
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
              className="rounded-xl p-4 border border-[#9C6B3E]/60 bg-[#2A1D12]/80 hover:bg-[#3B2A1E]/85 hover:border-[#E7B45D]/60 transition-all duration-300 cursor-pointer shadow-[0_8px_20px_rgba(10,8,6,0.6)]"
              onClick={() => handlePlayerClick(player.nickname)}
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                {/* Rank */}
                <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-[#E7B45D] to-[#B17A3D] rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]">
                  <span className="text-sm font-bold text-[#2A1D12]">{index + 1}</span>
                </div>
                
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-400">
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
                    <div className={`w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center ${player.avatarUrl ? 'hidden' : ''}`}>
                      <span className="text-lg font-bold text-amber-900">
                        {player.nickname.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-[#F4EBD0] truncate">
                      {player.nickname}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${
                      player.guild 
                        ? 'bg-[#3C7A57]/30 text-[#CFE6D8] border-[#3C7A57]/80 shadow-[0_0_10px_rgba(60,122,87,0.4)]'
                        : 'bg-[#2A1D12]/80 text-[#E7B45D] border-[#9C6B3E]/70 shadow-[0_0_8px_rgba(156,107,62,0.35)]'
                    }`}>
                      {player.guild || "No guild"}
                    </span>
                  </div>

                  {/* Level and XP Bar */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm font-semibold text-[#F4EBD0]">
                      LVL {player.level}
                    </span>
                    <div className="flex-1 bg-[#1C352D]/80 rounded-full h-2 sm:h-3 overflow-hidden border border-[#9C6B3E]/50">
                      <div 
                        className="h-full bg-gradient-to-r from-[#E7B45D] to-[#B17A3D] transition-all duration-500"
                        style={{ width: `${xpPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-[#B6AA96]">
                      {xpPercentage}%
                    </span>
                  </div>
                </div>

                {/* Achievements and Score */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Achievement Icons */}
                  <div className="flex gap-2">
                    {player.mvps > 0 && (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-[#E7B45D] to-[#B17A3D] rounded-full flex items-center justify-center shadow-[inset_0_1px_3px_rgba(255,255,255,0.35)]" title={`${player.mvps} MVP${player.mvps > 1 ? 's' : ''}`}>
                        <span className="text-[#2A1D12] text-sm">⭐</span>
                      </div>
                    )}
                    {player.tournamentsWon > 0 && (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-[#C99845] to-[#8B5E24] rounded-full flex items-center justify-center shadow-[inset_0_1px_3px_rgba(255,255,255,0.25)]" title={`${player.tournamentsWon} Tournament Win${player.tournamentsWon > 1 ? 's' : ''}`}>
                        <span className="text-[#2A1D12] text-sm">👑</span>
                      </div>
                    )}
                    {player.wins > 0 && (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#2A1D12] rounded-full flex items-center justify-center border border-[#9C6B3E]/70 shadow-[0_0_6px_rgba(0,0,0,0.6)]" title={`${player.wins} Win${player.wins > 1 ? 's' : ''}`}>
                        <span className="text-[#E7B45D] text-sm">🏆</span>
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-bold text-[#E7B45D]">
                      +{player.totalScore}
                    </div>
                    <div className="text-[10px] sm:text-xs text-[#B6AA96]">
                      points
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-8 text-[#B6AA96]">
            {searchTerm ? (
              <>
                <div className="text-lg text-[#F4EBD0]">No players found</div>
                <div className="text-sm mt-2 text-[#B6AA96]">No players match "{searchTerm}"</div>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-[#E7B45D] to-[#B17A3D] text-[#2A1D12] rounded-lg hover:from-[#F1C980] hover:to-[#C78943] transition-colors"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <div className="text-lg text-[#F4EBD0]">No leaderboard data available</div>
                <div className="text-sm mt-2 text-[#B6AA96]">Players will appear here as they play games</div>
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
