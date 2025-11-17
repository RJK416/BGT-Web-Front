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
  guild?: string;
  title?: string;
  role?: string;
  Role?: string;
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
  const [avatarError, setAvatarError] = useState(false);

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
        setAvatarError(false); // Reset avatar error when profile is fetched
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
    background: 'linear-gradient(135deg, rgba(52, 28, 15, 0.98) 0%, rgba(65, 34, 18, 0.95) 50%, rgba(52, 28, 15, 0.98) 100%)',
    border: '2px solid rgba(120, 80, 46, 0.95)',
    boxShadow: '0 18px 45px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
  };

  const achievementCardStyle: CSSProperties = {
    background: 'linear-gradient(180deg, rgba(28, 18, 12, 0.98) 0%, rgba(20, 12, 8, 0.99) 100%)',
    border: '1px solid rgba(78, 49, 28, 0.7)',
    borderRadius: '12px',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 14px 28px rgba(0, 0, 0, 0.7)',
    padding: '10px 12px',
    textAlign: 'center'
  };

  const supportingTextClass = 'text-[#B6AA96] text-sm';

  const avatarModalStyle: CSSProperties = {
    background: 'linear-gradient(135deg, rgba(52, 28, 15, 0.98) 0%, rgba(65, 34, 18, 0.95) 50%, rgba(52, 28, 15, 0.98) 100%)',
    border: '2px solid rgba(120, 80, 46, 0.95)',
    boxShadow: '0 18px 45px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
      <div
        className="rounded-2xl w-full overflow-hidden"
        style={{
          ...modalContainerStyle,
          maxWidth: '650px',
          maxHeight: '600px',
          aspectRatio: '4/3'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#9C6B3E]/50">
          <h2 className="text-lg font-bold text-[#F4EBD0]" style={{ fontFamily: 'var(--font-medieval), "Cinzel", "Times New Roman", serif', letterSpacing: '0.08em', textTransform: 'none' }}>Player Profile</h2>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              background: 'rgba(128, 44, 44, 0.2)',
              border: '1px solid rgba(156, 107, 62, 0.5)',
              borderRadius: '6px',
              color: '#e8a8a8',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
            className="hover:bg-red-500/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4" style={{ maxHeight: 'calc(600px - 60px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-[#F4EBD0]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E7B45D]"></div>
              <span className="ml-2 text-sm" style={{ textTransform: 'none' }}>Loading...</span>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <div className="text-[#e8a8a8] text-base mb-2" style={{ textTransform: 'none' }}>Error loading profile</div>
              <div className="text-[#B6AA96] text-xs mb-3">{error}</div>
              <button 
                onClick={fetchProfile}
                style={{
                  padding: '8px 12px',
                  background: 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                  border: '1px solid rgba(156, 107, 62, 0.7)',
                  borderRadius: '6px',
                  color: '#2A1D12',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                className="hover:opacity-90"
              >
                Try Again
              </button>
            </div>
          ) : profile ? (
            <div className="space-y-3">
              {/* Avatar and Basic Info */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  {profile.avatarUrl && !avatarError ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.userName}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '9999px',
                        border: '1px solid rgba(231, 180, 93, 0.7)',
                        boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)',
                        cursor: 'pointer'
                      }}
                      className="object-cover hover:opacity-80 transition-opacity"
                      onClick={() => handleAvatarClick(profile.avatarUrl!, profile.userName)}
                      onError={() => {
                        setAvatarError(true);
                      }}
                    />
                  ) : null}
                  <div 
                    className={`flex items-center justify-center ${profile.avatarUrl && !avatarError ? 'hidden' : ''}`}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '9999px',
                      background: 'radial-gradient(circle at 35% 25%, #f1c980 0%, #b37a3c 55%, #7a4a21 100%)',
                      border: '1px solid rgba(231, 180, 93, 0.7)',
                      boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)'
                    }}
                  >
                    <span className="text-xl font-bold text-[#2a1d12]">
                      {profile.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[#F4EBD0] truncate" style={{ fontFamily: 'Arial, Helvetica, sans-serif', textTransform: 'none' }}>
                    {profile.stats?.nickname || profile.userName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(60, 122, 87, 0.8)',
                      background: profile.isActive ? 'rgba(60, 122, 87, 0.18)' : 'rgba(128, 44, 44, 0.18)',
                      color: profile.isActive ? '#d7ead3' : '#e8a8a8',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'none',
                      whiteSpace: 'nowrap'
                    }}>
                      {profile.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {profile.guild && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        border: '1px solid rgba(78, 49, 28, 0.7)',
                        background: 'rgba(60, 122, 87, 0.18)',
                        color: '#ccba93',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'none',
                        whiteSpace: 'nowrap'
                      }}>
                        {profile.guild}
                      </span>
                    )}
                    {(() => {
                      const role = profile.role || profile.Role;
                      const isGM = role && (typeof role === 'string' ? role.toUpperCase() === 'GM' : role === 1);
                      return isGM ? (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          border: '1px solid rgba(231, 180, 93, 0.5)',
                          background: 'rgba(231, 180, 93, 0.15)',
                          color: '#d4b077',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                          textTransform: 'none',
                          whiteSpace: 'nowrap'
                        }}>
                          👑 Game Master
                        </span>
                      ) : null;
                    })()}
                    {profile.title && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        border: '1px solid rgba(156, 107, 62, 0.5)',
                        background: 'rgba(156, 107, 62, 0.15)',
                        color: '#d4b077',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'none',
                        whiteSpace: 'nowrap'
                      }}>
                        {profile.title}
                      </span>
                    )}
                  </div>
                </div>

                {/* Achievements on the right */}
                <div style={{
                  background: 'linear-gradient(180deg, rgba(28, 18, 12, 0.98) 0%, rgba(20, 12, 8, 0.99) 100%)',
                  border: '1px solid rgba(78, 49, 28, 0.7)',
                  borderRadius: '12px',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 14px 28px rgba(0, 0, 0, 0.7)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {profile.stats.mvps > 0 && (
                    <div className="flex flex-col items-center" title={`${profile.stats.mvps} MVP${profile.stats.mvps > 1 ? 's' : ''}`}>
                      <div 
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '9999px',
                          background: 'radial-gradient(circle at 35% 25%, #f1c980 0%, #b37a3c 55%, #7a4a21 100%)',
                          border: '1px solid rgba(231, 180, 93, 0.7)',
                          boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '4px'
                        }}
                      >
                        <span className="text-[#2a1d12] text-base" style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: '1'
                        }}>⭐</span>
                      </div>
                      <span className="text-[#d4b077] text-xs font-bold" style={{ textTransform: 'none' }}>{profile.stats.mvps}</span>
                    </div>
                  )}
                  {profile.stats.tournamentsWon > 0 && (
                    <div className="flex flex-col items-center" title={`${profile.stats.tournamentsWon} Tournament${profile.stats.tournamentsWon > 1 ? 's' : ''} Won`}>
                      <div 
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '9999px',
                          background: 'radial-gradient(circle at 35% 25%, #f1c980 0%, #b37a3c 55%, #7a4a21 100%)',
                          border: '1px solid rgba(231, 180, 93, 0.7)',
                          boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '4px'
                        }}
                      >
                        <span className="text-[#2a1d12] text-base" style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: '1'
                        }}>👑</span>
                      </div>
                      <span className="text-[#d4b077] text-xs font-bold" style={{ textTransform: 'none' }}>{profile.stats.tournamentsWon}</span>
                    </div>
                  )}
                  {profile.stats.wins > 0 && (
                    <div className="flex flex-col items-center" title={`${profile.stats.wins} Win${profile.stats.wins > 1 ? 's' : ''}`}>
                      <div 
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '9999px',
                          background: '#2a1d12',
                          border: '1px solid rgba(156, 107, 62, 0.7)',
                          boxShadow: '0 0 6px rgba(0, 0, 0, 0.55)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '4px'
                        }}
                      >
                        <span className="text-[#d4b077] text-base" style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: '1'
                        }}>🏆</span>
                      </div>
                      <span className="text-[#d4b077] text-xs font-bold" style={{ textTransform: 'none' }}>{profile.stats.wins}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Level and XP */}
              <div style={achievementCardStyle}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#d4b077] font-semibold font-medieval text-sm" style={{ textTransform: 'none' }}>Level {profile.stats.level}</span>
                  <span className="text-[#B6AA96] text-xs" style={{ textTransform: 'none' }}>{profile.stats.xp} XP</span>
                </div>
                <div style={{
                  background: 'rgba(42, 29, 18, 0.8)',
                  borderRadius: '9999px',
                  height: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(78, 49, 28, 0.5)',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
                  marginBottom: '4px'
                }}>
                  <div 
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #E7B45D 0%, #B17A3D 50%, #9C6B3E 100%)',
                      width: `${getXpProgress(profile.stats.xp)}%`,
                      transition: 'width 0.5s',
                      boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                    }}
                  ></div>
                </div>
                <div className="text-center text-xs text-[#9f8f79]" style={{ textTransform: 'none' }}>
                  {getXpProgress(profile.stats.xp)}% to next level
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div style={achievementCardStyle}>
                  <div className="text-xl font-bold text-[#60c878]" style={{ textTransform: 'none' }}>{profile.stats.matchesPlayed}</div>
                  <div className="text-[#B6AA96] text-xs" style={{ textTransform: 'none' }}>Matches</div>
                </div>
                
                <div style={achievementCardStyle}>
                  <div className="text-xl font-bold text-[#60c878]" style={{ textTransform: 'none' }}>{profile.stats.wins}</div>
                  <div className="text-[#B6AA96] text-xs" style={{ textTransform: 'none' }}>Wins</div>
                </div>
                
                <div style={achievementCardStyle}>
                  <div className="text-xl font-bold text-[#60c878]" style={{ textTransform: 'none' }}>{profile.stats.mvps}</div>
                  <div className="text-[#B6AA96] text-xs" style={{ textTransform: 'none' }}>MVPs</div>
                </div>
                
                <div style={achievementCardStyle}>
                  <div className="text-xl font-bold text-[#60c878]" style={{ textTransform: 'none' }}>{profile.stats.tournamentsWon}</div>
                  <div className="text-[#B6AA96] text-xs" style={{ textTransform: 'none' }}>Tournaments</div>
                </div>
              </div>

              {/* Win Rate */}
              <div style={achievementCardStyle}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#d4b077] font-semibold font-medieval text-sm" style={{ textTransform: 'none' }}>Win Rate</span>
                  <span className="text-[#B6AA96] text-xs">
                    {(() => {
                      const totalGames = profile.stats.matchesPlayed + profile.stats.tournamentsWon;
                      const calculatedWinRate = totalGames > 0 ? (profile.stats.wins / totalGames) * 100 : 0;
                      return calculatedWinRate.toFixed(1);
                    })()}%
                  </span>
                </div>
                <div style={{
                  background: 'rgba(42, 29, 18, 0.8)',
                  borderRadius: '9999px',
                  height: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(78, 49, 28, 0.5)',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
                }}>
                  <div 
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #E7B45D 0%, #B17A3D 50%, #9C6B3E 100%)',
                      width: `${(() => {
                        const totalGames = profile.stats.matchesPlayed + profile.stats.tournamentsWon;
                        const calculatedWinRate = totalGames > 0 ? (profile.stats.wins / totalGames) * 100 : 0;
                        return Math.min(100, calculatedWinRate);
                      })()}%`,
                      transition: 'width 0.5s',
                      boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                    }}
                  ></div>
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
            <div className="flex items-center justify-between mb-4 border-b border-[#9C6B3E]/50 pb-4">
              <h3 className="text-xl font-bold text-[#F4EBD0] medieval-heading" style={{ textTransform: 'none' }}>
                {selectedAvatar.nickname}'s Avatar
              </h3>
              <button
                onClick={handleAvatarModalClose}
                style={{
                  padding: '8px',
                  background: 'rgba(128, 44, 44, 0.2)',
                  border: '1px solid rgba(156, 107, 62, 0.5)',
                  borderRadius: '8px',
                  color: '#e8a8a8',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                className="hover:bg-red-500/30"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Avatar Image */}
            <div className="flex justify-center mb-4">
              <div style={{
                width: '256px',
                height: '256px',
                borderRadius: '9999px',
                overflow: 'hidden',
                border: '2px solid rgba(231, 180, 93, 0.7)',
                boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25), 0 20px 40px rgba(0, 0, 0, 0.5)'
              }}>
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
                <div className="w-full h-full flex items-center justify-center hidden" style={{
                  background: 'radial-gradient(circle at 35% 25%, #f1c980 0%, #b37a3c 55%, #7a4a21 100%)'
                }}>
                  <span className="text-6xl font-bold text-[#2a1d12]">
                    {selectedAvatar.nickname.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="text-center">
              <p className="text-[#B6AA96] text-sm" style={{ textTransform: 'none' }}>
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
