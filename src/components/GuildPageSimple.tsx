'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken, getUserFromToken, isAuthenticated } from '@/utils/auth';
import GuildChat from './GuildChat';
import { guildService } from '@/services/guildService';
import { API_CONFIG } from '@/config/api';
import type { Guild, GuildMember } from '@/types/guild';
import { tavernPalette } from '@/styles/tavernTheme';

interface InviteRequest {
  guildId: number;
  username: string;
  message?: string;
  expiresInDays?: number;
}

// Simple API call functions
const fetchMyGuild = async (): Promise<Guild | null> => {
  try {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      console.error('No auth token found');
      return null;
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GUILD.GET_MY_GUILD}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('Guild API Response:', data);

    if (data.status === 200 && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
};

const sendGuildInvite = async (guildId: number, username: string, message?: string, expiresInDays: number = 30): Promise<boolean> => {
  try {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      console.error('No auth token found');
      return false;
    }

    const inviteData = {
      GuildId: guildId,
      Username: username,
      Message: message || undefined,
      ExpiresInDays: expiresInDays
    };

    console.log('Sending invite with data:', inviteData);

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GUILD.SEND_INVITATION}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inviteData),
    });

    const data = await response.json();
    console.log('Invite API Response:', data);

    return response.ok && data.status === 200;
  } catch (error) {
    console.error('Invite error:', error);
    return false;
  }
};

export default function GuildPageSimple() {
  const [user, setUser] = useState<any>(null);
  const [guild, setGuild] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showCreateGuildModal, setShowCreateGuildModal] = useState(false);
  const [guildName, setGuildName] = useState('');
  const [guildDescription, setGuildDescription] = useState('');
  const [createGuildLoading, setCreateGuildLoading] = useState(false);
  const [createGuildMessage, setCreateGuildMessage] = useState<string | null>(null);
  const [isUploadingEmblem, setIsUploadingEmblem] = useState(false);
  const [emblemError, setEmblemError] = useState<string | null>(null);
  const [emblemSuccess, setEmblemSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      // Check auth
      if (!isAuthenticated()) {
        router.push('/');
        return;
      }

      try {
        const userFromToken = getUserFromToken();
        if (userFromToken) {
          setUser(userFromToken);
        }

        // Fetch guild data
        const guildData = await fetchMyGuild();
        if (guildData) {
          setGuild(guildData);
        } else {
          setError('No guild found or failed to load');
        }
      } catch (err) {
        console.error('Init error:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleLogout = () => {
    removeAuthToken();
    router.push('/');
  };

  const handleInvitePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim() || !guild) return;

    // Validate username length (backend requirement: 3-20 characters)
    if (inviteUsername.trim().length < 3 || inviteUsername.trim().length > 20) {
      setInviteSuccess('Username must be between 3 and 20 characters');
      return;
    }

    setInviteLoading(true);
    setInviteSuccess(null);

    try {
      const success = await sendGuildInvite(
        guild.id,
        inviteUsername.trim(),
        inviteMessage.trim() || undefined,
        30 // expires in 30 days
      );

      if (success) {
        setInviteSuccess(`Invitation sent to ${inviteUsername}!`);
        setInviteUsername('');
        setInviteMessage('');
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteSuccess(null);
        }, 2000);
      } else {
        setInviteSuccess('Failed to send invitation. Please try again.');
      }
    } catch (error) {
      setInviteSuccess('Error sending invitation. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  const openInviteModal = () => {
    setShowInviteModal(true);
    setInviteUsername('');
    setInviteMessage('');
    setInviteSuccess(null);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteUsername('');
    setInviteMessage('');
    setInviteSuccess(null);
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
        const guildData = await fetchMyGuild();
        if (guildData) {
          setGuild(guildData);
          setError(null);
        }
        // Close modal after a short delay
        setTimeout(() => {
          setShowCreateGuildModal(false);
          setGuildName('');
          setGuildDescription('');
          setCreateGuildMessage(null);
        }, 1500);
      } else {
        setCreateGuildMessage(response.message || 'Failed to create guild. Please try again.');
      }
    } catch (error) {
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

  const handleEmblemUpload = async (file: File) => {
    if (!file || !guild) return;

    setEmblemError(null);
    setEmblemSuccess(null);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setEmblemError('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setEmblemError('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploadingEmblem(true);
      await guildService.uploadEmblem(file);
      setEmblemSuccess('Emblem uploaded successfully!');
      
      // Refresh guild data
      const guildData = await fetchMyGuild();
      if (guildData) {
        setGuild(guildData);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setEmblemSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error uploading emblem:', error);
      setEmblemError(error.message || 'Failed to upload emblem');
      setTimeout(() => {
        setEmblemError(null);
      }, 5000);
    } finally {
      setIsUploadingEmblem(false);
    }
  };

  // Check if user can upload emblem (Leader or Officer)
  const canUploadEmblem = guild && (guild.userRole === 'Leader' || guild.userRole === 'Officer');

  const pageBackgroundStyle: CSSProperties = {
    backgroundColor: 'rgba(8, 47, 35, 1)',
    backgroundImage: `
      linear-gradient(to bottom right, rgba(8, 47, 35, 0.98), rgba(4, 30, 24, 0.95)),
      radial-gradient(circle at top left, rgba(21, 128, 61, 0.28), transparent 55%),
      radial-gradient(circle at bottom right, rgba(13, 84, 57, 0.24), transparent 60%)
    `,
    backgroundBlendMode: 'overlay'
  };

  const panelStyle: CSSProperties = {
    backgroundColor: 'rgba(68, 36, 19, 0.95)',
    backgroundImage: `
      linear-gradient(to bottom right, rgba(68, 36, 19, 0.95), rgba(87, 44, 23, 0.96)),
      linear-gradient(90deg, rgba(68, 36, 19, 0.75), rgba(87, 44, 23, 0.82), rgba(68, 36, 19, 0.75))
    `,
    border: '1px solid rgba(120, 53, 15, 0.55)',
    boxShadow: '0 25px 70px rgba(0, 0, 0, 0.45)'
  };

  const subPanelClass =
    'rounded-xl border border-amber-900/40 bg-amber-950/60';

  const mutedTextClass = 'text-amber-200/80';

  const toastStyle: CSSProperties = {
    backgroundColor: 'rgba(68, 36, 19, 0.92)',
    border: '1px solid rgba(217, 119, 6, 0.5)',
    color: '#fcd34d'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={pageBackgroundStyle}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-amber-200">Loading guild...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={pageBackgroundStyle}>
      {/* Header */}
      <header
        className="relative z-10 backdrop-blur-sm border-b border-amber-900/40"
        style={{background: 'linear-gradient(to right, rgba(20, 83, 45, 0.92), rgba(12, 50, 35, 0.92))'}}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
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
              <h1 className="text-2xl font-bold text-amber-400">Guild</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-amber-200/90">Welcome, {(user as any)?.name || (user as any)?.unique_name || (user as any)?.username || 'User'}</span>
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error ? (
          <div className="rounded-xl p-8 text-center" style={panelStyle}>
            <h3 className="text-2xl font-bold text-orange-300 mb-4">No Guild Found</h3>
            <p className={`${mutedTextClass} text-lg mb-6`}>{error}</p>
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
          </div>
        ) : guild ? (
          <div className="space-y-6">
            {/* Guild Info */}
            <div className="rounded-xl p-6" style={panelStyle}>
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mb-6">
                {/* Guild Emblem */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <input
                      type="file"
                      id="emblem-upload"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleEmblemUpload(file);
                        }
                        // Reset input so same file can be selected again
                        e.target.value = '';
                      }}
                      className="hidden"
                      disabled={isUploadingEmblem || !canUploadEmblem}
                    />
                    <label
                      htmlFor="emblem-upload"
                      className={`block ${canUploadEmblem && !isUploadingEmblem ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
                      title={canUploadEmblem ? 'Click to upload emblem' : ''}
                    >
                      {guild.emblemUrl ? (
                        <img
                          src={guild.emblemUrl}
                          alt={guild.name}
                          className="w-24 h-24 rounded-lg object-cover border-4 transition-all duration-200"
                          style={{
                            borderColor: '#E7B45D',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
                            opacity: isUploadingEmblem ? 0.5 : 1
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
                        className={`w-24 h-24 rounded-lg flex items-center justify-center text-3xl font-bold border-4 transition-all duration-200 relative`}
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, #f1c980 0%, #b37a3c 55%, #7a4a21 100%)',
                          borderColor: '#E7B45D',
                          boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)',
                          color: '#2A1D12',
                          display: guild.emblemUrl ? 'none' : 'flex',
                          opacity: isUploadingEmblem ? 0.5 : 1
                        }}
                      >
                        {isUploadingEmblem ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A1D12]"></div>
                        ) : (
                          guild.name.charAt(0).toUpperCase()
                        )}
                      </div>
                    </label>
                    {/* Error/Success Messages */}
                    {emblemError && (
                      <div 
                        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded text-xs"
                        style={{
                          background: `${tavernPalette.ruby}CC`,
                          color: '#F4C2C2',
                          border: `1px solid ${tavernPalette.ruby}`,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                          zIndex: 10
                        }}
                      >
                        {emblemError}
                      </div>
                    )}
                    {emblemSuccess && (
                      <div 
                        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded text-xs"
                        style={{
                          background: `${tavernPalette.emerald}CC`,
                          color: tavernPalette.parchment,
                          border: `1px solid ${tavernPalette.emerald}`,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                          zIndex: 10
                        }}
                      >
                        {emblemSuccess}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-orange-300 mb-4">{guild.name}</h2>
                  <p className={`${mutedTextClass}`}>{guild.description || 'No description provided.'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-300">{guild.memberCount}</div>
                  <div className={`text-sm ${mutedTextClass}`}>Members</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-300">{guild.maxMember}</div>
                  <div className={`text-sm ${mutedTextClass}`}>Max Members</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-300">{guild.level}</div>
                  <div className={`text-sm ${mutedTextClass}`}>Guild Level</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-300">{guild.userRole}</div>
                  <div className={`text-sm ${mutedTextClass}`}>Your Role</div>
                </div>
              </div>
              
              <div className={`text-sm ${mutedTextClass} mb-4`}>
                Created by {guild.creatorName} on {new Date(guild.created).toLocaleDateString()}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                {/* Chat Button */}
                <button
                  onClick={() => setShowChat(true)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  💬 Guild Chat
                </button>
                
                {/* Invite Player Button */}
                {(guild.userRole === 'Leader' || guild.userRole === 'Officer') && (
                  <button
                    onClick={openInviteModal}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    ✨ Invite Player
                  </button>
                )}
              </div>
            </div>

            {/* Guild Members */}
            <div className={`${subPanelClass} p-6`}>
              <h3 className="text-2xl font-bold text-orange-300 mb-6">Guild Members</h3>
              <div className="space-y-4">
                {guild.members.map((member) => (
                  <div
                    key={member.playerId}
                    className="rounded-lg p-4 border border-amber-900/40 bg-gradient-to-r from-amber-950/70 via-amber-900/60 to-amber-950/70"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.playerName}
                              className="w-12 h-12 rounded-full object-cover border-2 border-amber-400"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-amber-950 font-bold text-lg ${member.avatarUrl ? 'hidden' : ''}`}>
                            {member.playerName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-amber-300 font-semibold text-lg">{member.playerName}</h4>
                          <p className={mutedTextClass}>Level {member.playerLevel || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-amber-300 text-lg">
                          {member.role}
                        </div>
                        <div className={`${mutedTextClass} text-sm`}>
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-8 text-center" style={panelStyle}>
            <h3 className="text-2xl font-bold text-orange-300 mb-4">No Guild Found</h3>
            <p className={`${mutedTextClass} text-lg mb-6`}>You are not currently a member of any guild.</p>
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
          </div>
        )}
      </div>

      {/* Invite Player Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 border-2 border-amber-900/50 w-full max-w-md mx-4 bg-amber-950/80 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-orange-300">Invite Player</h3>
              <button
                onClick={closeInviteModal}
                className="text-amber-200 hover:text-orange-300 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleInvitePlayer} className="space-y-4">
              <div>
                <label className="block text-amber-200 text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Enter player username"
                  className="w-full px-3 py-2 bg-amber-950/70 border border-amber-900/40 rounded-lg text-amber-100 placeholder-amber-500/70 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                  required
                />
              </div>

              <div>
                <label className="block text-amber-200 text-sm font-medium mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Optional invitation message"
                  rows={3}
                  className="w-full px-3 py-2 bg-amber-950/70 border border-amber-900/40 rounded-lg text-amber-100 placeholder-amber-500/70 focus:outline-none focus:ring-2 focus:ring-orange-500/40 resize-none"
                />
              </div>

              {inviteSuccess && (
                <div
                  className={`p-3 rounded-lg text-sm border ${
                    inviteSuccess.includes('sent')
                      ? 'bg-emerald-900/40 text-emerald-200 border-emerald-500/40'
                      : 'bg-red-900/40 text-red-200 border-red-500/40'
                  }`}
                >
                  {inviteSuccess}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeInviteModal}
                  className="flex-1 px-4 py-2 bg-amber-950/70 hover:bg-amber-900/60 border border-amber-900/40 text-amber-200 rounded-lg transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading || !inviteUsername.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg transition-all duration-300"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Guild Chat Modal */}
      {showChat && guild && (
        <GuildChat
          guildId={guild.id}
          guildName={guild.name}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
