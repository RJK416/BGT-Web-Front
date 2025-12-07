'use client';

import React, { useState, useEffect } from 'react';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-amber-300">Loading guild data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Floating Particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-purple-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 left-40 w-3 h-3 bg-blue-300 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-60 left-60 w-1 h-1 bg-cyan-300 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '2s' }} />
        
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
      <header className="relative z-10 backdrop-blur-sm border-b border-amber-400/30" style={{background: 'linear-gradient(to right, rgba(26, 95, 82, 0.9), rgba(15, 66, 52, 0.9))'}}>
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
                <h1 className="text-2xl font-bold text-amber-400">Guild</h1>
                <p className="text-emerald-200 text-sm">Chronicle Your Adventures</p>
              </div>
            </div>
            
            {/* Right side - User controls */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-between sm:justify-end">
              <span className="text-purple-200 text-sm sm:text-base">Welcome, {(user as any)?.username || (user as any)?.name || (user as any)?.unique_name || 'User'}</span>
              
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
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-400 hover:text-red-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 bg-gradient-to-br from-purple-950/90 to-purple-900/90 rounded-xl p-4 border border-amber-400/30">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('my-guild')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'my-guild'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-purple-900 shadow-lg'
                  : 'bg-purple-800/50 text-amber-300 hover:bg-purple-700/50'
              }`}
            >
              🏰 My Guild
            </button>
            <button
              onClick={() => setActiveTab('all-guilds')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'all-guilds'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-purple-900 shadow-lg'
                  : 'bg-purple-800/50 text-amber-300 hover:bg-purple-700/50'
              }`}
            >
              🌍 All Guilds
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 relative ${
                activeTab === 'invitations'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-purple-900 shadow-lg'
                  : 'bg-purple-800/50 text-amber-300 hover:bg-purple-700/50'
              }`}
            >
              📬 Invitations
              {myInvitations.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
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
                <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 rounded-xl p-6 border border-amber-400/30">
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
                      <h2 className="text-2xl font-bold text-amber-400 mb-4">{myGuild.name}</h2>
                      <p className="text-purple-300 mb-4">{myGuild.description || 'No description provided.'}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-300">{myGuild.memberCount}</div>
                          <div className="text-sm text-purple-400">Members</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-300">{myGuild.maxMember}</div>
                          <div className="text-sm text-purple-400">Max Members</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-300">{myGuild.level}</div>
                          <div className="text-sm text-purple-400">Guild Level</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-300">{myGuild.userRole}</div>
                          <div className="text-sm text-purple-400">Your Role</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-purple-400">
                        Created by {myGuild.creatorName} on {new Date(myGuild.created).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guild Members */}
                <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 rounded-xl p-6 border border-amber-400/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-amber-400">Guild Members</h3>
                    {/* Only show appoint GM button for current GMs */}
                    {isGM && (
                      <button
                        onClick={() => setIsAppointGMModalOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-medium rounded-lg transition-all duration-300"
                      >
                        Appoint GM
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {myGuild.members.map((member) => (
                      <div
                        key={member.playerId}
                        className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 rounded-lg p-4 border border-amber-400/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              {member.avatarUrl ? (
                                <img
                                  src={member.avatarUrl}
                                  alt={member.playerName}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-400"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-purple-900 font-bold ${member.avatarUrl ? 'hidden' : ''}`}>
                                {member.playerName.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-amber-300 font-semibold">{member.playerName}</h4>
                              <p className="text-purple-400 text-sm">Level {member.playerLevel || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-amber-300">
                              {member.role}
                            </div>
                            <div className="text-purple-400 text-sm">
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
              <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 rounded-xl p-8 border border-amber-400/30 text-center">
                <h3 className="text-xl font-bold text-amber-400 mb-4">No Guild</h3>
                <p className="text-purple-300 mb-6">You are not currently a member of any guild.</p>
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
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 rounded-xl p-6 border border-amber-400/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-amber-400">All Guilds</h3>
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
                    className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 rounded-lg p-4 border border-amber-400/20"
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
                                borderColor: '#E7B45D',
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
                              borderColor: '#E7B45D',
                              boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)',
                              color: '#2A1D12',
                              display: guild.emblemUrl ? 'none' : 'flex'
                            }}
                          >
                            {guild.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-amber-300 font-semibold text-lg truncate">{guild.name}</h4>
                          <p className="text-purple-400 text-sm mb-2 truncate">{guild.description || 'No description provided.'}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-purple-400">
                            <span>{guild.memberCount}/{guild.maxMember} members</span>
                            <span>Level {guild.level}</span>
                            <span>Created by {guild.creatorName}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300"
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
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 rounded-xl p-6 border border-amber-400/30">
              <h3 className="text-xl font-bold text-amber-400 mb-4">Guild Invitations</h3>
              {myInvitations.length > 0 ? (
                <div className="space-y-4">
                  {myInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 rounded-lg p-4 border border-amber-400/20"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="text-amber-300 font-semibold text-lg">{invitation.guild.name}</h4>
                          <p className="text-purple-400 text-sm mb-2">{invitation.guild.description || 'No description provided.'}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-purple-400 mb-2">
                            <span>{invitation.guild.memberCount}/{invitation.guild.maxMembers} members</span>
                          </div>
                          <p className="text-amber-300 text-sm">
                            Invited by <span className="font-semibold">{invitation.inviter.nickname}</span>
                          </p>
                          {invitation.message && (
                            <p className="text-purple-300 text-sm mt-2 italic">"{invitation.message}"</p>
                          )}
                          <p className="text-purple-400 text-xs mt-2">
                            Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleInvitationResponse(invitation.id, InviteStatus.Accepted)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleInvitationResponse(invitation.id, InviteStatus.Declined)}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg transition-all duration-300"
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
                  <p className="text-purple-300">No pending invitations</p>
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
