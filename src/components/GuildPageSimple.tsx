'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken, getUserFromToken, isAuthenticated } from '@/utils/auth';
import GuildChat from './GuildChat';
import { guildService } from '@/services/guildService';
import { API_CONFIG } from '@/config/api';

// Simple types based on your actual API response
interface GuildMember {
  playerId: number;
  playerName: string;
  role: string;
  joinedAt: string;
  playerLevel?: number;
}

interface Guild {
  id: number;
  name: string;
  description?: string;
  creatorName: string;
  created: string;
  level: number;
  memberCount: number;
  maxMember: number;
  userRole: string;
  joinedAt: string;
  members: GuildMember[];
}

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
              <img src="/4447.png" alt="Castle Logo" className="w-12 h-12 object-contain" />
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
          <div className="rounded-lg p-6 text-center" style={toastStyle}>
            <p className="text-lg">{error}</p>
          </div>
        ) : guild ? (
          <div className="space-y-6">
            {/* Guild Info */}
            <div className="rounded-xl p-6" style={panelStyle}>
              <h2 className="text-3xl font-bold text-orange-300 mb-4">{guild.name}</h2>
              <p className={`${mutedTextClass} mb-6`}>{guild.description || 'No description provided.'}</p>
              
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
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-amber-950 font-bold text-lg">
                          {member.playerName.charAt(0).toUpperCase()}
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
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 border-2 border-amber-900/50 w-full max-w-md mx-4 bg-amber-950/80 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-orange-300">Create New Guild</h3>
              <button
                onClick={closeCreateGuildModal}
                className="text-amber-200 hover:text-orange-300 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateGuild} className="space-y-4">
              <div>
                <label className="block text-amber-200 text-sm font-medium mb-2">
                  Guild Name *
                </label>
                <input
                  type="text"
                  value={guildName}
                  onChange={(e) => setGuildName(e.target.value)}
                  placeholder="Enter guild name (3-20 characters)"
                  className="w-full px-3 py-2 bg-amber-950/70 border border-amber-900/40 rounded-lg text-amber-100 placeholder-amber-500/70 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                  required
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-amber-200 text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={guildDescription}
                  onChange={(e) => setGuildDescription(e.target.value)}
                  placeholder="Enter guild description"
                  rows={3}
                  className="w-full px-3 py-2 bg-amber-950/70 border border-amber-900/40 rounded-lg text-amber-100 placeholder-amber-500/70 focus:outline-none focus:ring-2 focus:ring-orange-500/40 resize-none"
                />
              </div>

              {createGuildMessage && (
                <div
                  className={`p-3 rounded-lg text-sm border ${
                    createGuildMessage.includes('successfully')
                      ? 'bg-emerald-900/40 text-emerald-200 border-emerald-500/40'
                      : 'bg-red-900/40 text-red-200 border-red-500/40'
                  }`}
                >
                  {createGuildMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeCreateGuildModal}
                  className="flex-1 px-4 py-2 bg-amber-950/70 hover:bg-amber-900/60 border border-amber-900/40 text-amber-200 rounded-lg transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGuildLoading || !guildName.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg transition-all duration-300"
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
