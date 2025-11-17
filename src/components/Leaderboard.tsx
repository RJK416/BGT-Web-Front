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
  refreshTrigger?: number; // When this changes, refresh the leaderboard
}

export default function Leaderboard({ limit = 10, showTitle = true, className = '', showPagination = false, showSearch = true, style, refreshTrigger }: LeaderboardProps) {
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
        const players = data.players || [];
        // Debug: Log first player's avatarUrl
        if (players.length > 0) {
          console.log('First player avatarUrl:', players[0].avatarUrl);
        }
        setLeaderboard(players);
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
        // Hide technical backend errors from users, show generic message
        const errorMessage = response.error || response.message || 'Failed to fetch leaderboard';
        // Filter out technical file path errors
        if (errorMessage.includes('Could not find file') || errorMessage.includes('.json')) {
          setError('Unable to load leaderboard at this time. Please try again later.');
        } else {
          setError(errorMessage);
        }
        setLeaderboard([]);
      }
    } catch (error) {
      console.error('🔍 Error fetching leaderboard:', error);
      // Hide technical errors from users
      const errorMessage = error instanceof Error ? error.message : 'Error fetching leaderboard';
      if (errorMessage.includes('Could not find file') || errorMessage.includes('.json')) {
        setError('Unable to load leaderboard at this time. Please try again later.');
      } else {
        setError('Unable to load leaderboard. Please check your connection and try again.');
      }
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [limit, fetchLeaderboard]);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchLeaderboard();
    }
  }, [refreshTrigger, fetchLeaderboard]);

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

  const rowContainerStyle: CSSProperties = {
    background: 'linear-gradient(180deg, rgba(41, 26, 17, 0.96) 0%, rgba(27, 18, 12, 0.98) 100%)',
    border: '1px solid rgba(78, 49, 28, 0.65)',
    borderRadius: '16px',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 14px 28px rgba(8, 6, 4, 0.55)',
    padding: '18px 22px',
    position: 'relative'
  };

  const rankBadgeStyle: CSSProperties = {
    width: '42px',
    height: '42px',
    borderRadius: '9999px',
    background: 'radial-gradient(circle at 30% 30%, #6c4729 0%, #2f1b10 70%)',
    border: '1px solid rgba(120, 80, 46, 0.85)',
    boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.12), 0 6px 10px rgba(0, 0, 0, 0.45)',
    color: '#f4ebd0',
    fontSize: '1.05rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const avatarBadgeStyle: CSSProperties = {
    width: '44px',
    height: '44px',
    borderRadius: '9999px',
    background: 'radial-gradient(circle at 35% 25%, #f1c980 0%, #b37a3c 55%, #7a4a21 100%)',
    border: '1px solid rgba(231, 180, 93, 0.7)',
    boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)',
    color: '#2a1d12',
    fontSize: '1.1rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const guildBadgeStyle: CSSProperties = {
    padding: '2px 10px',
    borderRadius: '9999px',
    border: '1px solid rgba(156, 107, 62, 0.45)',
    background: 'rgba(60, 122, 87, 0.15)',
    color: '#d8e6ce',
    fontSize: '0.65rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  };

  const xpTrackStyle: CSSProperties = {
    flex: 1,
    height: '7px',
    borderRadius: '9999px',
    background: 'linear-gradient(180deg, rgba(21, 31, 28, 0.95) 0%, rgba(16, 22, 18, 0.95) 100%)',
    border: '1px solid rgba(46, 32, 22, 0.7)',
    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.6)',
    overflow: 'hidden'
  };

  const xpFillBaseStyle: CSSProperties = {
    height: '100%',
    borderRadius: '9999px',
    background: 'linear-gradient(180deg, #c08a37 0%, #8b5c20 100%)',
    boxShadow: '0 0 12px rgba(192, 138, 55, 0.45)'
  };

  const pointsBadgeStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    width: '110px'
  };

  const pointsBadgeInnerStyle: CSSProperties = {
    width: '110px',
    minWidth: '110px',
    padding: '7px 0',
    fontWeight: 700,
    fontSize: '1rem',
    color: '#f4ebd0',
    background: 'linear-gradient(180deg, #3a2a1d 0%, #23160d 100%)',
    border: '1px solid rgba(120, 80, 46, 0.9)',
    borderRadius: '12px',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px rgba(0, 0, 0, 0.45)',
    textAlign: 'center'
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
            <h2 className="text-2xl font-bold text-[#F4EBD0] medieval-heading">Top Players</h2>
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
            <h2 className="text-2xl font-bold text-[#F4EBD0] medieval-heading">Top Players</h2>
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
    <div className={`medieval-panel p-4 sm:p-6 relative ${className}`}
      style={mergedContainerStyle}
    >
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#F4EBD0] medieval-heading">Top Players</h2>
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

          const guildStyle = {
            ...guildBadgeStyle,
            background: player.guild ? 'rgba(60, 122, 87, 0.18)' : 'rgba(60, 122, 87, 0.08)',
            color: player.guild ? '#d7ead3' : '#ccba93'
          };

          return (
            <div
              key={player.id}
              style={rowContainerStyle}
              className="group cursor-pointer"
              onClick={() => handlePlayerClick(player.nickname)}
            >
              <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
                <div style={rankBadgeStyle} className="font-medieval select-none">
                  {index + 1}
                </div>

                <div className="relative" style={{ width: '44px', height: '44px' }}>
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={player.nickname}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '9999px',
                        border: '1px solid rgba(231, 180, 93, 0.7)',
                        boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)',
                        position: 'relative',
                        zIndex: 10,
                        display: 'block'
                      }}
                      className="select-none transition-transform duration-200 group-hover:scale-105 object-cover cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAvatarClick(player.avatarUrl!, player.nickname);
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.classList.remove('hidden');
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '9999px',
                      background: 'radial-gradient(circle at 35% 25%, #f1c980 0%, #b37a3c 55%, #7a4a21 100%)',
                      border: '1px solid rgba(231, 180, 93, 0.7)',
                      boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)',
                      color: '#2a1d12',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      zIndex: player.avatarUrl ? 0 : 1,
                      display: player.avatarUrl ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    className={`select-none transition-transform duration-200 group-hover:scale-105 ${player.avatarUrl ? 'hidden' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (player.avatarUrl) {
                        handleAvatarClick(player.avatarUrl, player.nickname);
                      }
                    }}
                  >
                    {player.nickname.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[#F4EBD0] truncate" style={{ fontFamily: 'Arial, Helvetica, sans-serif', textTransform: 'none' }}>
                      {player.nickname}
                    </h3>
                    <span style={guildStyle}>{player.guild || 'No guild'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#d4b077] font-medieval">
                      LVL {player.level}
                    </span>
                    <div style={xpTrackStyle}>
                      <div
                        style={{
                          ...xpFillBaseStyle,
                          width: `${xpPercentage}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-[#9f8f79]">
                      {xpPercentage}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  {player.mvps > 0 || player.tournamentsWon > 0 || player.wins > 0 ? (
                    <div className="flex items-center gap-2">
                      {player.mvps > 0 && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#c08a37] to-[#8b5c20] flex items-center justify-center text-[#2a1d12] text-sm shadow-[inset_0_1px_3px_rgba(255,255,255,0.28)]" title={`${player.mvps} MVP${player.mvps > 1 ? 's' : ''}`}>
                          ⭐
                        </div>
                      )}
                      {player.tournamentsWon > 0 && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#c99845] to-[#8b5e24] flex items-center justify-center text-[#2a1d12] text-sm shadow-[inset_0_1px_3px_rgba(255,255,255,0.22)]" title={`${player.tournamentsWon} Tournament Win${player.tournamentsWon > 1 ? 's' : ''}`}>
                          👑
                        </div>
                      )}
                      {player.wins > 0 && (
                        <div className="w-7 h-7 rounded-full bg-[#2a1d12] border border-[#9c6b3e]/70 flex items-center justify-center text-[#d4b077] text-sm shadow-[0_0_6px_rgba(0,0,0,0.55)]" title={`${player.wins} Win${player.wins > 1 ? 's' : ''}`}>
                          🏆
                        </div>
                      )}
                    </div>
                  ) : null}

                    <div style={pointsBadgeStyle}>
                    <div style={pointsBadgeInnerStyle} className="font-medieval">
                      +{player.totalScore}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#8f7d66] font-semibold">
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
