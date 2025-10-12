'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken, getUserFromToken, isAuthenticated } from '@/utils/auth';

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

    const response = await fetch('https://a9mykszmmd.eu-central-1.awsapprunner.com/Get-My-Guild', {
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
      guildId: guildId,
      username: username,
      message: message || undefined,
      expiresInDays: expiresInDays
    };

    console.log('Sending invite with data:', inviteData);

    const response = await fetch('https://a9mykszmmd.eu-central-1.awsapprunner.com/Send-Guild-Invitation', {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-amber-300">Loading guild...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-10 backdrop-blur-sm border-b border-amber-400/30" style={{background: 'linear-gradient(to right, rgba(26, 95, 82, 0.9), rgba(15, 66, 52, 0.9))'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img src="/4447.png" alt="Castle Logo" className="w-12 h-12 object-contain" />
              <h1 className="text-2xl font-bold text-amber-400">Guild</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-purple-200">Welcome, {user?.name || 'User'}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-300"
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
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
            <p className="text-red-300 text-lg">{error}</p>
          </div>
        ) : guild ? (
          <div className="space-y-6">
            {/* Guild Info */}
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 rounded-xl p-6 border border-amber-400/30">
              <h2 className="text-3xl font-bold text-amber-400 mb-4">{guild.name}</h2>
              <p className="text-purple-300 mb-6">{guild.description || 'No description provided.'}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-300">{guild.memberCount}</div>
                  <div className="text-sm text-purple-400">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-300">{guild.maxMember}</div>
                  <div className="text-sm text-purple-400">Max Members</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-300">{guild.level}</div>
                  <div className="text-sm text-purple-400">Guild Level</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-300">{guild.userRole}</div>
                  <div className="text-sm text-purple-400">Your Role</div>
                </div>
              </div>
              
              <div className="text-sm text-purple-400 mb-4">
                Created by {guild.creatorName} on {new Date(guild.created).toLocaleDateString()}
              </div>
              
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

            {/* Guild Members */}
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 rounded-xl p-6 border border-amber-400/30">
              <h3 className="text-2xl font-bold text-amber-400 mb-6">Guild Members</h3>
              <div className="space-y-4">
                {guild.members.map((member) => (
                  <div
                    key={member.playerId}
                    className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 rounded-lg p-4 border border-amber-400/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-purple-900 font-bold text-lg">
                          {member.playerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-amber-300 font-semibold text-lg">{member.playerName}</h4>
                          <p className="text-purple-400">Level {member.playerLevel || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-amber-300 text-lg">
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
          </div>
        ) : (
          <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 rounded-xl p-8 border border-amber-400/30 text-center">
            <h3 className="text-2xl font-bold text-amber-400 mb-4">No Guild Found</h3>
            <p className="text-purple-300 text-lg">You are not currently a member of any guild.</p>
          </div>
        )}
      </div>

      {/* Invite Player Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-purple-950/95 to-purple-900/95 rounded-xl p-6 border-2 border-amber-400/30 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-amber-400">Invite Player</h3>
              <button
                onClick={closeInviteModal}
                className="text-purple-300 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleInvitePlayer} className="space-y-4">
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Enter player username"
                  className="w-full px-3 py-2 bg-purple-800/50 border border-amber-400/30 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Optional invitation message"
                  rows={3}
                  className="w-full px-3 py-2 bg-purple-800/50 border border-amber-400/30 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              {inviteSuccess && (
                <div className={`p-3 rounded-lg text-sm ${
                  inviteSuccess.includes('sent') 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {inviteSuccess}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeInviteModal}
                  className="flex-1 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-all duration-300"
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
    </div>
  );
}
