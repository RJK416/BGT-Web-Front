'use client';

import { useState, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { API_CONFIG, apiRequest, buildApiUrl } from '@/config/api';

interface BoardgameStats {
  playerId: number;
  nickname: string;
  xp: number;
  level: number;
  matchesPlayed: number;
  wins: number;
  mvps: number;
  tournamentsWon: number;
  winRate: number;
}

interface UserProfile {
  id: number;
  userName: string;
  isActive: boolean;
  avatarUrl?: string;
  stats: BoardgameStats;
}

interface UserProfileCardProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileCard({ username, isOpen, onClose }: UserProfileCardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<{url: string, nickname: string} | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const fetchProfile = async () => {
    if (!username) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.ACCOUNT.GET_PROFILE_BY_USERNAME, { username });
      const response = await apiRequest(url, {
        method: 'GET',
      });

      if (response.ok && response.status === 200) {
        setProfile(response.data);
      } else {
        setError(response.error || response.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error instanceof Error ? error.message : 'Error fetching profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && username) {
      fetchProfile();
    }
  }, [isOpen, username]);

  const handleAvatarClick = (avatarUrl: string, nickname: string) => {
    setSelectedAvatar({ url: avatarUrl, nickname });
    setIsAvatarModalOpen(true);
  };

  const handleAvatarModalClose = () => {
    setIsAvatarModalOpen(false);
    setSelectedAvatar(null);
  };

  if (!isOpen) return null;

  // Calculate XP progress
  const getXpProgress = (xp: number) => {
    const levelBase = Math.floor(xp / 1000) * 1000;
    const xpInCurrentLevel = xp - levelBase;
    return Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / 1000) * 100)));
  };

  const modalContainerStyle: CSSProperties = {
    backgroundColor: 'rgba(68, 36, 19, 0.96)',
    backgroundImage: `
      linear-gradient(to bottom right, rgba(68, 36, 19, 0.96) 0%, rgba(87, 44, 23, 0.96) 50%, rgba(68, 36, 19, 0.96) 100%),
      linear-gradient(90deg, rgba(68, 36, 19, 0.7) 0%, rgba(87, 44, 23, 0.75) 50%, rgba(68, 36, 19, 0.7) 100%),
      linear-gradient(0deg, rgba(68, 36, 19, 0.6) 0%, rgba(87, 44, 23, 0.65) 30%, rgba(68, 36, 19, 0.6) 50%, rgba(87, 44, 23, 0.65) 70%, rgba(68, 36, 19, 0.6) 100%)
    `,
    backgroundBlendMode: 'overlay',
    border: '1px solid rgba(120, 53, 15, 0.45)',
    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.45)'
  };

  const achievementCardClass =
    'bg-amber-950/60 rounded-xl p-4 border border-amber-900/40 text-center';

  const supportingTextClass = 'text-amber-200 text-sm';

  const avatarModalStyle: CSSProperties = {
    backgroundColor: 'rgba(68, 36, 19, 0.95)',
    backgroundImage: `
      linear-gradient(to bottom right, rgba(68, 36, 19, 0.95) 0%, rgba(87, 44, 23, 0.95) 50%, rgba(68, 36, 19, 0.95) 100%),
      linear-gradient(90deg, rgba(68, 36, 19, 0.75) 0%, rgba(87, 44, 23, 0.8) 50%, rgba(68, 36, 19, 0.75) 100%)
    `,
    border: '1px solid rgba(120, 53, 15, 0.5)',
    boxShadow: '0 30px 90px rgba(0, 0, 0, 0.45)'
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
      <div
        className="rounded-2xl border border-amber-900/40 max-w-md w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm"
        style={modalContainerStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-900/40">
          <h2 className="text-xl font-bold text-amber-400">Player Profile</h2>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-orange-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-amber-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
              <span className="ml-3">Loading profile...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-400 text-lg mb-2">Error loading profile</div>
              <div className="text-amber-200 text-sm mb-4">{error}</div>
              <button 
                onClick={fetchProfile}
                className="px-4 py-2 bg-amber-500 text-amber-950 rounded-lg hover:bg-amber-400 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.userName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleAvatarClick(profile.avatarUrl!, profile.userName)}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center border-2 border-amber-400 ${profile.avatarUrl ? 'hidden' : ''}`}>
                    <span className="text-2xl font-bold text-amber-950">
                      {profile.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-amber-300">{profile.userName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      profile.isActive 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                        : 'bg-red-500/20 text-red-300 border border-red-400/30'
                    }`}>
                      {profile.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Level and XP */}
              <div className="bg-amber-950/60 rounded-xl p-4 border border-amber-900/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-400 font-bold">Level {profile.stats.level}</span>
                  <span className="text-amber-200 text-sm">{profile.stats.xp} XP</span>
                </div>
                <div className="bg-amber-950/70 rounded-full h-3 overflow-hidden border border-amber-900/50">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                    style={{ width: `${getXpProgress(profile.stats.xp)}%` }}
                  ></div>
                </div>
                <div className="text-center text-xs text-amber-200 mt-1">
                  {getXpProgress(profile.stats.xp)}% to next level
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className={achievementCardClass}>
                  <div className="text-2xl font-bold text-amber-400">{profile.stats.matchesPlayed}</div>
                  <div className={supportingTextClass}>Matches Played</div>
                </div>
                
                <div className={achievementCardClass}>
                  <div className="text-2xl font-bold text-green-400">{profile.stats.wins}</div>
                  <div className={supportingTextClass}>Wins</div>
                </div>
                
                <div className={achievementCardClass}>
                  <div className="text-2xl font-bold text-yellow-400">{profile.stats.mvps}</div>
                  <div className={supportingTextClass}>MVPs</div>
                </div>
                
                <div className={achievementCardClass}>
                  <div className="text-2xl font-bold text-orange-400">{profile.stats.tournamentsWon}</div>
                  <div className={supportingTextClass}>Tournaments Won</div>
                </div>
              </div>

              {/* Win Rate */}
              <div className="bg-amber-950/60 rounded-xl p-4 border border-amber-900/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-400 font-bold">Win Rate</span>
                  <span className="text-amber-200 text-sm">{(profile.stats.winRate * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-amber-950/70 rounded-full h-3 overflow-hidden border border-amber-900/50">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                    style={{ width: `${profile.stats.winRate * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-amber-950/60 rounded-xl p-4 border border-amber-900/40">
                <h4 className="text-amber-400 font-bold mb-3">Achievements</h4>
                <div className="flex gap-3 justify-center">
                  {profile.stats.mvps > 0 && (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mb-1">
                        <span className="text-yellow-900 text-xl">⭐</span>
                      </div>
                      <span className="text-xs text-amber-200">{profile.stats.mvps} MVP{profile.stats.mvps > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  
                  {profile.stats.tournamentsWon > 0 && (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mb-1">
                        <span className="text-yellow-100 text-xl">👑</span>
                      </div>
                      <span className="text-xs text-amber-200">{profile.stats.tournamentsWon} Tournament{profile.stats.tournamentsWon > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  
                  {profile.stats.wins > 0 && (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-1">
                        <span className="text-white text-xl">🏆</span>
                      </div>
                      <span className="text-xs text-amber-200">{profile.stats.wins} Win{profile.stats.wins > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  
                  {profile.stats.mvps === 0 && profile.stats.tournamentsWon === 0 && profile.stats.wins === 0 && (
                    <div className="text-center text-amber-200">
                      <div className="text-4xl mb-2">🎯</div>
                      <div className="text-sm">Ready to earn achievements!</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Avatar Modal */}
      {isAvatarModalOpen && selectedAvatar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div
            className="rounded-2xl p-6 max-w-md w-full border border-amber-900/50"
            style={avatarModalStyle}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-amber-300">
                {selectedAvatar.nickname}'s Avatar
              </h3>
              <button
                onClick={handleAvatarModalClose}
                className="text-amber-200 hover:text-orange-300 transition-colors p-2 hover:bg-amber-950/50 rounded-full"
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
                  <span className="text-6xl font-bold text-amber-950">
                    {selectedAvatar.nickname.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="text-center">
              <p className="text-amber-200 text-sm">
                Click outside or press ESC to close
              </p>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
