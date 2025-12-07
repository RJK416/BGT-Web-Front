'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken, getUserFromToken, isAuthenticated } from '@/utils/auth';
import { guildService } from '@/services/guildService';
import { GuildRole, InviteStatus, AppointGMRequest } from '@/types/guild';
import type { Guild, GuildMember, GuildInvitation } from '@/types/guild';
import NotificationBar from '@/components/NotificationBar';
import AppointGMModal from '@/components/AppointGMModal';
import { tavernPalette } from '@/styles/tavernTheme';

// ✅ Keep this type if you want typed access to extended claims
type MyJwtPayload = import('jwt-decode').JwtPayload & {
  name?: string;
  unique_name?: string;
  email?: string;
};

export default function GuildPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [guildMembers, setGuildMembers] = useState<GuildMember[]>([]);
  const [myInvitations, setMyInvitations] = useState<GuildInvitation[]>([]);
  const [allGuilds, setAllGuilds] = useState<Guild[]>([]);
  const [activeTab, setActiveTab] = useState<'my-guild' | 'all-guilds' | 'invitations'>('my-guild');
  const [error, setError] = useState<string | null>(null);
  const [userPlayer, setUserPlayer] = useState<any>(null);
  const [isAppointGMModalOpen, setIsAppointGMModalOpen] = useState(false);
  const [showCreateGuildModal, setShowCreateGuildModal] = useState(false);
  const [guildName, setGuildName] = useState('');
  const [guildDescription, setGuildDescription] = useState('');
  const [createGuildLoading, setCreateGuildLoading] = useState(false);
  const [createGuildMessage, setCreateGuildMessage] = useState<string | null>(null);
  
  const router = useRouter();

  // Check if user is GM
  const isGM = (() => {
    const r = userPlayer?.role;
    if (r == null) return false;
    if (typeof r === 'string') return r.toUpperCase() === 'GM';
    return r === 1; // numeric enum fallback
  })();

  // ✅ Fixed useEffect: single place to do auth, set user, then fetch data
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/');
        return;
      }

      try {
        const jwtToken = getAuthToken();
        const userFromToken = getUserFromToken();

        if (!jwtToken || !userFromToken) {
          removeAuthToken();
          router.push('/');
          return;
        }

        const typed = userFromToken as MyJwtPayload;
        setUser({
          username: typed.name ?? typed.unique_name ?? typed.sub ?? 'User',
          email: typed.email ?? 'No email',
        });

        // Fetch guild data
        await fetchGuildData();
      } catch (error) {
        console.error('Auth error:', error);
        removeAuthToken();
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchGuildData = async () => {
    try {
      // Fetch user player data to check GM status
      const userPlayerResponse = await guildService.getUserPlayer();
      if (userPlayerResponse.isSuccess && userPlayerResponse.data) {
        setUserPlayer(userPlayerResponse.data);
      }

      // Fetch my guild
      const guildResponse = await guildService.getMyGuild();
      if (guildResponse.isSuccess && guildResponse.data) {
        setMyGuild(guildResponse.data);
        
        // Guild members are already included in the guild response
      }

      // Fetch my invitations
      const invitationsResponse = await guildService.getMyInvitations();
      if (invitationsResponse.isSuccess && invitationsResponse.data) {
        setMyInvitations(invitationsResponse.data);
      }

      // Fetch all guilds
      const allGuildsResponse = await guildService.getAllGuilds(1, 20);
      if (allGuildsResponse.isSuccess && allGuildsResponse.data) {
        setAllGuilds(allGuildsResponse.data.guilds);
      }
    } catch (error) {
      console.error('Error fetching guild data:', error);
      setError('Failed to load guild data');
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    router.push('/');
  };

  const getRoleDisplayName = (role: GuildRole): string => {
    switch (role) {
      case 0: // GuildRole.Leader
        return '👑 Leader';
      case 1: // GuildRole.Officer
        return '⚔️ Officer';
      case 2: // GuildRole.Member
        return '🛡️ Member';
      default:
        return '❓ Unknown';
    }
  };

  const getRoleColor = (role: GuildRole): string => {
    switch (role) {
      case 0: // GuildRole.Leader
        return 'text-yellow-400';
      case 1: // GuildRole.Officer
        return 'text-blue-400';
      case 2: // GuildRole.Member
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleInvitationResponse = async (inviteId: number, status: InviteStatus) => {
    try {
      const response = await guildService.respondToInvitation({ 
        inviteId, 
        status, 
        dateTime: new Date().toISOString() 
      });
      if (response.isSuccess) {
        // Refresh invitations and guild data
        await fetchGuildData();
      } else {
        setError(response.message || 'Failed to respond to invitation');
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      setError('Failed to respond to invitation');
    }
  };

  const handleAppointGMSuccess = async () => {
    // Refresh guild data to show updated roles
    await fetchGuildData();
  };

  const handleCreateGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guildName.trim()) return;

    // Validate guild name length (3-20 characters)
    if (guildName.trim().length < 3 || guildName.trim().length > 20) {
      setCreateGuildMessage('Guild name must be between 3 and 20 characters');
      return;
    }

    setCreateGuildLoading(true);
    setCreateGuildMessage(null);

    try {
      const response = await guildService.createGuild({
        name: guildName.trim(),
        description: guildDescription.trim() || undefined,
      });

      if (response.isSuccess && response.data) {
        setCreateGuildMessage('Guild created successfully! Loading...');
        // Refresh guild data
        await fetchGuildData();
        // Close modal after a short delay
        setTimeout(() => {
          setShowCreateGuildModal(false);
          setGuildName('');
          setGuildDescription('');
          setCreateGuildMessage(null);
          // Switch to my-guild tab to see the newly created guild
          setActiveTab('my-guild');
        }, 1500);
      } else {
        setCreateGuildMessage(response.message || 'Failed to create guild. Please try again.');
      }
    } catch (error) {
      console.error('Error creating guild:', error);
      setCreateGuildMessage('Error creating guild. Please try again.');
    } finally {
      setCreateGuildLoading(false);
    }
  };

  const openCreateGuildModal = () => {
    setShowCreateGuildModal(true);
    setGuildName('');
    setGuildDescription('');
    setCreateGuildMessage(null);
  };

  const closeCreateGuildModal = () => {
    setShowCreateGuildModal(false);
    setGuildName('');
    setGuildDescription('');
    setCreateGuildMessage(null);
  };

  const pageBackgroundStyle: CSSProperties = {
    minHeight: '100vh',
    backgroundColor: tavernPalette.background,
    backgroundImage: `radial-gradient(circle at top, rgba(15, 35, 29, 0.65), transparent 55%), radial-gradient(circle at bottom, rgba(12, 24, 20, 0.6), transparent 60%)`,
    color: tavernPalette.parchment
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={pageBackgroundStyle}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: tavernPalette.gold }}></div>
          <p style={{ color: tavernPalette.gold }}>Loading guild data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={pageBackgroundStyle}>
      {/* Header */}
      <header 
        className="relative z-10 backdrop-blur-sm border-b" 
        style={{
          background: 'linear-gradient(135deg, rgba(21, 49, 39, 0.95), rgba(13, 32, 26, 0.95))',
          borderBottom: `1px solid ${tavernPalette.border}`,
          boxShadow: `0 10px 35px ${tavernPalette.shadow}`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-3 relative">
            {/* Left side - Logo and Title */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img 
                src="/mainLogo.png" 
                alt="Guild Logo" 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Logo loaded successfully');
                }}
              />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: tavernPalette.gold }}>Guild</h1>
                <p className="text-sm" style={{ color: tavernPalette.parchment }}>Chronicle Your Adventures</p>
              </div>
            </div>
            
            {/* Right side - User controls */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-between sm:justify-end">
              <span className="text-sm sm:text-base" style={{ color: tavernPalette.parchment }}>Welcome, {(user as any)?.username || (user as any)?.name || (user as any)?.unique_name || 'User'}</span>
              
              {/* Notification Bar */}
              <NotificationBar className="flex-shrink-0" />
              
              <button
                onClick={() => router.push('/dashboard')}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                  border: '1px solid rgba(156, 107, 62, 0.7)',
                  borderRadius: '8px',
                  color: '#2A1D12',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                className="hover:opacity-90"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/settings')}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                  border: '1px solid rgba(156, 107, 62, 0.7)',
                  borderRadius: '8px',
                  color: '#2A1D12',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                className="hover:opacity-90"
              >
                Settings
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(180deg, rgba(128, 44, 44, 0.9) 0%, rgba(90, 25, 25, 0.95) 100%)',
                  border: '1px solid rgba(156, 107, 62, 0.7)',
                  borderRadius: '8px',
                  color: '#F4EBD0',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 4px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                className="hover:opacity-90"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        
        {/* Error Message */}
        {error && (
          <div 
            className="mb-6 p-4 rounded-lg border"
            style={{
              background: `${tavernPalette.ruby}40`,
              borderColor: tavernPalette.ruby,
            }}
          >
            <p style={{ color: '#F4C2C2' }}>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm"
              style={{ color: '#F4C2C2' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div 
          className="mb-6 rounded-xl p-4 border"
          style={{
            background: tavernPalette.panelGradient,
            border: `1px solid ${tavernPalette.border}`,
            boxShadow: `0 4px 12px ${tavernPalette.shadow}`
          }}
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('my-guild')}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200"
              style={activeTab === 'my-guild' ? {
                background: `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`,
                color: tavernPalette.borderDark,
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)'
              } : {
                background: tavernPalette.backgroundAlt,
                color: tavernPalette.parchment,
                border: `1px solid ${tavernPalette.border}`,
                boxShadow: tavernPalette.insetShadow
              }}
            >
              🏰 My Guild
            </button>
            <button
              onClick={() => setActiveTab('all-guilds')}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200"
              style={activeTab === 'all-guilds' ? {
                background: `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`,
                color: tavernPalette.borderDark,
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)'
              } : {
                background: tavernPalette.backgroundAlt,
                color: tavernPalette.parchment,
                border: `1px solid ${tavernPalette.border}`,
                boxShadow: tavernPalette.insetShadow
              }}
            >
              🌍 All Guilds
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 relative"
              style={activeTab === 'invitations' ? {
                background: `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`,
                color: tavernPalette.borderDark,
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)'
              } : {
                background: tavernPalette.backgroundAlt,
                color: tavernPalette.parchment,
                border: `1px solid ${tavernPalette.border}`,
                boxShadow: tavernPalette.insetShadow
              }}
            >
              📬 Invitations
              {myInvitations.length > 0 && (
                <span 
                  className="absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  style={{ background: tavernPalette.ruby }}
                >
                  {myInvitations.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'my-guild' && (
          <div className="space-y-6">
            {myGuild ? (
              <>
                {/* Guild Info */}
                <div 
                  className="rounded-xl p-6 border"
                  style={{
                    background: tavernPalette.panelGradient,
                    border: `1px solid ${tavernPalette.border}`,
                    boxShadow: `0 8px 24px ${tavernPalette.shadow}`
                  }}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Guild Emblem */}
                    <div className="flex-shrink-0 flex justify-center lg:justify-start">
                      <div className="relative">
                        {myGuild.emblemUrl ? (
                          <img
                            src={myGuild.emblemUrl}
                            alt={myGuild.name}
                            className="w-24 h-24 rounded-lg object-cover border-4"
                            style={{
                              borderColor: '#E7B45D',
                              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2)'
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-24 h-24 rounded-lg flex items-center justify-center text-3xl font-bold border-4`}
                          style={{
                            background: 'radial-gradient(circle at 30% 30%, #f1c980 0%, #b37a3c 55%, #7a4a21 100%)',
                            borderColor: '#E7B45D',
                            boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)',
                            color: '#2A1D12',
                            display: myGuild.emblemUrl ? 'none' : 'flex'
                          }}
                        >
                          {myGuild.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-4" style={{ color: tavernPalette.gold }}>{myGuild.name}</h2>
                      <p className="mb-4" style={{ color: tavernPalette.parchment }}>{myGuild.description || 'No description provided.'}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold" style={{ color: tavernPalette.goldLight }}>{myGuild.memberCount}</div>
                          <div className="text-sm" style={{ color: tavernPalette.ash }}>Members</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold" style={{ color: tavernPalette.goldLight }}>{myGuild.maxMember}</div>
                          <div className="text-sm" style={{ color: tavernPalette.ash }}>Max Members</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold" style={{ color: tavernPalette.goldLight }}>{myGuild.level}</div>
                          <div className="text-sm" style={{ color: tavernPalette.ash }}>Guild Level</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold" style={{ color: tavernPalette.goldLight }}>{myGuild.userRole}</div>
                          <div className="text-sm" style={{ color: tavernPalette.ash }}>Your Role</div>
                        </div>
                      </div>
                      
                      <div className="text-sm" style={{ color: tavernPalette.ash }}>
                        Created by {myGuild.creatorName} on {new Date(myGuild.created).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guild Members */}
                <div 
                  className="rounded-xl p-6 border"
                  style={{
                    background: tavernPalette.panelGradient,
                    border: `1px solid ${tavernPalette.border}`,
                    boxShadow: `0 8px 24px ${tavernPalette.shadow}`
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold" style={{ color: tavernPalette.gold }}>Guild Members</h3>
                    {/* Only show appoint GM button for current GMs */}
                    {isGM && (
                      <button
                        onClick={() => setIsAppointGMModalOpen(true)}
                        className="px-4 py-2 font-medium rounded-lg transition-all duration-300"
                        style={{
                          background: `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`,
                          color: tavernPalette.borderDark,
                          border: `1px solid ${tavernPalette.border}`,
                          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        Appoint GM
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {myGuild.members.map((member) => (
                      <div
                        key={member.playerId}
                        className="rounded-lg p-4 border"
                        style={{
                          background: tavernPalette.backgroundAlt,
                          border: `1px solid ${tavernPalette.border}`,
                          boxShadow: tavernPalette.insetShadow
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              {member.avatarUrl ? (
                                <img
                                  src={member.avatarUrl}
                                  alt={member.playerName}
                                  className="w-10 h-10 rounded-full object-cover border-2"
                                  style={{ borderColor: tavernPalette.gold }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${member.avatarUrl ? 'hidden' : ''}`}
                                style={{
                                  background: `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`,
                                  color: tavernPalette.borderDark,
                                  border: `2px solid ${tavernPalette.gold}`
                                }}
                              >
                                {member.playerName.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold" style={{ color: tavernPalette.goldLight }}>{member.playerName}</h4>
                              <p className="text-sm" style={{ color: tavernPalette.ash }}>Level {member.playerLevel || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium" style={{ color: tavernPalette.goldLight }}>
                              {member.role}
                            </div>
                            <div className="text-sm" style={{ color: tavernPalette.ash }}>
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div 
                className="rounded-xl p-8 border text-center"
                style={{
                  background: tavernPalette.panelGradient,
                  border: `1px solid ${tavernPalette.border}`,
                  boxShadow: `0 8px 24px ${tavernPalette.shadow}`
                }}
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: tavernPalette.gold }}>No Guild</h3>
                <p className="mb-6" style={{ color: tavernPalette.parchment }}>You are not currently a member of any guild.</p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <button
                    onClick={openCreateGuildModal}
                    style={{
                      padding: '12px 24px',
                      background: `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`,
                      border: `1px solid ${tavernPalette.border}`,
                      borderRadius: '8px',
                      color: tavernPalette.borderDark,
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.4)',
                      transition: 'all 0.3s',
                      cursor: 'pointer'
                    }}
                    className="hover:opacity-90 hover:shadow-lg"
                  >
                    🏰 Create New Guild
                  </button>
                  <button
                    onClick={() => setActiveTab('all-guilds')}
                    style={{
                      padding: '12px 24px',
                      background: `linear-gradient(180deg, ${tavernPalette.emerald} 0%, ${tavernPalette.emeraldDark} 100%)`,
                      border: `1px solid ${tavernPalette.border}`,
                      borderRadius: '8px',
                      color: tavernPalette.parchment,
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 4px 8px rgba(0, 0, 0, 0.4)',
                      transition: 'all 0.3s',
                      cursor: 'pointer'
                    }}
                    className="hover:opacity-90 hover:shadow-lg"
                  >
                    Browse Guilds
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'all-guilds' && (
          <div className="space-y-6">
            <div 
              className="rounded-xl p-6 border"
              style={{
                background: tavernPalette.panelGradient,
                border: `1px solid ${tavernPalette.border}`,
                boxShadow: `0 8px 24px ${tavernPalette.shadow}`
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold" style={{ color: tavernPalette.gold }}>All Guilds</h3>
                <button
                  onClick={openCreateGuildModal}
                  style={{
                    padding: '10px 20px',
                    background: `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`,
                    border: `1px solid ${tavernPalette.border}`,
                    borderRadius: '8px',
                    color: tavernPalette.borderDark,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.4)',
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                  }}
                  className="hover:opacity-90 hover:shadow-lg"
                >
                  🏰 Create New Guild
                </button>
              </div>
              <div className="space-y-3">
                {allGuilds.map((guild) => (
                  <div
                    key={guild.id}
                    className="rounded-lg p-4 border"
                    style={{
                      background: tavernPalette.backgroundAlt,
                      border: `1px solid ${tavernPalette.border}`,
                      boxShadow: tavernPalette.insetShadow
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Guild Emblem */}
                        <div className="relative flex-shrink-0">
                          {guild.emblemUrl ? (
                            <img
                              src={guild.emblemUrl}
                              alt={guild.name}
                              className="w-16 h-16 rounded-lg object-cover border-2"
                              style={{
                                borderColor: tavernPalette.gold,
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-16 h-16 rounded-lg flex items-center justify-center text-xl font-bold border-2`}
                            style={{
                              background: 'radial-gradient(circle at 30% 30%, #f1c980 0%, #b37a3c 55%, #7a4a21 100%)',
                              borderColor: tavernPalette.gold,
                              boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)',
                              color: tavernPalette.borderDark,
                              display: guild.emblemUrl ? 'none' : 'flex'
                            }}
                          >
                            {guild.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg truncate" style={{ color: tavernPalette.goldLight }}>{guild.name}</h4>
                          <p className="text-sm mb-2 truncate" style={{ color: tavernPalette.ash }}>{guild.description || 'No description provided.'}</p>
                          <div className="flex flex-wrap gap-4 text-sm" style={{ color: tavernPalette.ash }}>
                            <span>{guild.memberCount}/{guild.maxMember} members</span>
                            <span>Level {guild.level}</span>
                            <span>Created by {guild.creatorName}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        className="px-4 py-2 font-medium rounded-lg transition-all duration-300"
                        style={{
                          background: `linear-gradient(180deg, ${tavernPalette.emerald} 0%, ${tavernPalette.emeraldDark} 100%)`,
                          color: tavernPalette.parchment,
                          border: `1px solid ${tavernPalette.border}`,
                          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 4px rgba(0, 0, 0, 0.3)'
                        }}
                        onClick={() => {
                          // TODO: Implement join guild functionality
                          console.log('Join guild:', guild.id);
                        }}
                      >
                        Request to Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="space-y-6">
            <div 
              className="rounded-xl p-6 border"
              style={{
                background: tavernPalette.panelGradient,
                border: `1px solid ${tavernPalette.border}`,
                boxShadow: `0 8px 24px ${tavernPalette.shadow}`
              }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: tavernPalette.gold }}>Guild Invitations</h3>
              {myInvitations.length > 0 ? (
                <div className="space-y-4">
                  {myInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="rounded-lg p-4 border"
                      style={{
                        background: tavernPalette.backgroundAlt,
                        border: `1px solid ${tavernPalette.border}`,
                        boxShadow: tavernPalette.insetShadow
                      }}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg" style={{ color: tavernPalette.goldLight }}>{invitation.guild.name}</h4>
                          <p className="text-sm mb-2" style={{ color: tavernPalette.ash }}>{invitation.guild.description || 'No description provided.'}</p>
                          <div className="flex flex-wrap gap-4 text-sm mb-2" style={{ color: tavernPalette.ash }}>
                            <span>{invitation.guild.memberCount}/{invitation.guild.maxMembers} members</span>
                          </div>
                          <p className="text-sm" style={{ color: tavernPalette.goldLight }}>
                            Invited by <span className="font-semibold">{invitation.inviter.nickname}</span>
                          </p>
                          {invitation.message && (
                            <p className="text-sm mt-2 italic" style={{ color: tavernPalette.parchment }}>"{invitation.message}"</p>
                          )}
                          <p className="text-xs mt-2" style={{ color: tavernPalette.ash }}>
                            Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleInvitationResponse(invitation.id, InviteStatus.Accepted)}
                            className="px-4 py-2 font-medium rounded-lg transition-all duration-300"
                            style={{
                              background: `linear-gradient(180deg, ${tavernPalette.emerald} 0%, ${tavernPalette.emeraldDark} 100%)`,
                              color: tavernPalette.parchment,
                              border: `1px solid ${tavernPalette.border}`,
                              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 4px rgba(0, 0, 0, 0.3)'
                            }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleInvitationResponse(invitation.id, InviteStatus.Declined)}
                            className="px-4 py-2 font-medium rounded-lg transition-all duration-300"
                            style={{
                              background: `linear-gradient(180deg, ${tavernPalette.ruby} 0%, rgba(90, 25, 25, 0.95) 100%)`,
                              color: tavernPalette.parchment,
                              border: `1px solid ${tavernPalette.border}`,
                              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 4px rgba(0, 0, 0, 0.4)'
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p style={{ color: tavernPalette.parchment }}>No pending invitations</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Appoint GM Modal */}
      <AppointGMModal
        isOpen={isAppointGMModalOpen}
        onClose={() => setIsAppointGMModalOpen(false)}
        onSuccess={() => {
          // Refresh guild data after successful appointment
          fetchGuildData();
        }}
        currentGuildMembers={myGuild?.members || []}
      />

      {/* Create Guild Modal */}
      {showCreateGuildModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div 
            className="rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl"
            style={{
              background: tavernPalette.panelGradient,
              border: `2px solid ${tavernPalette.border}`,
              boxShadow: `0 20px 60px ${tavernPalette.shadow}, ${tavernPalette.glow}`
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 
                className="text-xl font-bold"
                style={{ color: tavernPalette.gold }}
              >
                Create New Guild
              </h3>
              <button
                onClick={closeCreateGuildModal}
                className="text-2xl font-bold transition-colors hover:opacity-70"
                style={{ color: tavernPalette.parchment }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateGuild} className="space-y-4">
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: tavernPalette.parchment }}
                >
                  Guild Name *
                </label>
                <input
                  type="text"
                  value={guildName}
                  onChange={(e) => setGuildName(e.target.value)}
                  placeholder="Enter guild name (3-20 characters)"
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    background: tavernPalette.backgroundAlt,
                    border: `1px solid ${tavernPalette.border}`,
                    color: tavernPalette.parchment,
                    boxShadow: tavernPalette.insetShadow
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = tavernPalette.gold;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${tavernPalette.gold}40`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = tavernPalette.border;
                    e.currentTarget.style.boxShadow = tavernPalette.insetShadow;
                  }}
                  required
                  maxLength={20}
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: tavernPalette.parchment }}
                >
                  Description (Optional)
                </label>
                <textarea
                  value={guildDescription}
                  onChange={(e) => setGuildDescription(e.target.value)}
                  placeholder="Enter guild description"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 resize-none transition-all duration-200"
                  style={{
                    background: tavernPalette.backgroundAlt,
                    border: `1px solid ${tavernPalette.border}`,
                    color: tavernPalette.parchment,
                    boxShadow: tavernPalette.insetShadow
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = tavernPalette.gold;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${tavernPalette.gold}40`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = tavernPalette.border;
                    e.currentTarget.style.boxShadow = tavernPalette.insetShadow;
                  }}
                />
              </div>

              {createGuildMessage && (
                <div
                  className="p-3 rounded-lg text-sm border"
                  style={{
                    background: createGuildMessage.includes('successfully') 
                      ? `${tavernPalette.emerald}40` 
                      : `${tavernPalette.ruby}40`,
                    color: createGuildMessage.includes('successfully')
                      ? tavernPalette.parchment
                      : '#F4C2C2',
                    borderColor: createGuildMessage.includes('successfully')
                      ? tavernPalette.emerald
                      : tavernPalette.ruby
                  }}
                >
                  {createGuildMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeCreateGuildModal}
                  className="flex-1 px-4 py-2 rounded-lg transition-all duration-300 font-medium"
                  style={{
                    background: tavernPalette.backgroundAlt,
                    border: `1px solid ${tavernPalette.border}`,
                    color: tavernPalette.parchment,
                    boxShadow: tavernPalette.insetShadow
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGuildLoading || !guildName.trim()}
                  className="flex-1 px-4 py-2 rounded-lg transition-all duration-300 font-medium"
                  style={{
                    background: createGuildLoading || !guildName.trim()
                      ? '#4A4A4A'
                      : `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`,
                    border: `1px solid ${tavernPalette.border}`,
                    color: createGuildLoading || !guildName.trim()
                      ? '#888'
                      : tavernPalette.borderDark,
                    boxShadow: createGuildLoading || !guildName.trim()
                      ? 'none'
                      : 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.4)',
                    cursor: createGuildLoading || !guildName.trim() ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!createGuildLoading && guildName.trim()) {
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {createGuildLoading ? 'Creating...' : 'Create Guild'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
