'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken, getUserFromToken, isAuthenticated } from '@/utils/auth';
import { API_CONFIG, apiRequest } from '@/config/api';

export default function GuildPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guilds, setGuilds] = useState<any[]>([]);
  const [guildsLoading, setGuildsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingGuild, setCreatingGuild] = useState(false);
  const [message, setMessage] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [infoSuccess, setInfoSuccess] = useState(false);

  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/');
        return;
      }

      try {
        const userData = getUserFromToken();
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Error getting user from token:', error);
        removeAuthToken();
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch guilds
  const fetchGuilds = async () => {
    try {
      setGuildsLoading(true);
      const response = await apiRequest(
        `${API_CONFIG.BASE_URL}/Guild/Get-Guilds`,
        { method: 'GET' }
      );

      if (response.ok && response.status === 200) {
        setGuilds(response.data || response.result || []);
      } else {
        console.error('Failed to fetch guilds:', response);
        setGuilds([]);
      }
    } catch (error) {
      console.error('Error fetching guilds:', error);
      setGuilds([]);
    } finally {
      setGuildsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGuilds();
    }
  }, [user]);

  const handleLogout = () => {
    removeAuthToken();
    router.push('/');
  };

  const handleCreateGuild = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreatingGuild(true);
    setMessage('');

    try {
      const formData = new FormData(e.currentTarget);
      const guildData = {
        Name: formData.get('name') as string,
        Description: formData.get('description') as string,
        EmblemUrl: formData.get('emblemUrl') as string || '',
        MaxMember: parseInt(formData.get('maxMember') as string) || 5,
        Level: parseInt(formData.get('level') as string) || 1
      };

      const response = await apiRequest(
        `${API_CONFIG.BASE_URL}/Guild/Add-Guild`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(guildData)
        }
      );

      if (response.ok) {
        setInfoSuccess(true);
        setInfoMessage(response.message || 'Guild created successfully!');
        setInfoOpen(true);
        setShowCreateForm(false);
        fetchGuilds(); // Refresh guild list
      } else {
        setInfoSuccess(false);
        setInfoMessage(response.message || 'Failed to create guild');
        setInfoOpen(true);
      }
    } catch (error: any) {
      setInfoSuccess(false);
      setInfoMessage(error.message || 'Failed to create guild');
      setInfoOpen(true);
    } finally {
      setCreatingGuild(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-purple-200">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Header */}
      <header className="relative z-20 bg-gradient-to-r from-purple-900/95 to-indigo-900/95 backdrop-blur-sm border-b border-amber-400/30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-900" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M12 2L4 6v8c0 4 3 6 8 8 5-2 8-4 8-8V6l-8-4z"/>
                  <circle cx="12" cy="10" r="2" fill="amber-300"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-amber-400">Guild</h1>
                <p className="text-purple-200 text-sm">Manage Your Guild</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-medium rounded-lg transition-all duration-300 text-sm"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-300 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Left Content */}
          <div className="flex-1">
            {/* Guild List */}
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-amber-400/30 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-amber-400">Available Guilds</h2>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-medium rounded-lg transition-all duration-300 text-sm sm:text-base self-start sm:self-auto"
                >
                  {showCreateForm ? 'Cancel' : 'Create Guild'}
                </button>
              </div>
              
              {guildsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto mb-4"></div>
                  <p className="text-purple-200">Loading guilds...</p>
                </div>
              ) : guilds.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-purple-200">No guilds found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {guilds.map((guild) => (
                    <div key={guild.id} className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 rounded-lg p-4 border border-amber-400/20">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-amber-300">{guild.name}</h3>
                          <p className="text-purple-200 text-sm">{guild.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-purple-300">
                            <span>Level: {guild.level}</span>
                            <span>Members: {guild.memberCount}/{guild.maxMember}</span>
                            <span>Created: {new Date(guild.created).toLocaleDateString('de-DE')}</span>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-300 text-sm">
                          Join Guild
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Guild Form */}
            {showCreateForm && (
              <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-amber-400/30 mb-6 sm:mb-8">
                <h3 className="text-lg font-bold text-amber-400 mb-4">Create New Guild</h3>
                <form onSubmit={handleCreateGuild} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Guild Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 focus:border-amber-400 focus:outline-none"
                      placeholder="Enter guild name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Description</label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      className="w-full px-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 focus:border-amber-400 focus:outline-none"
                      placeholder="Enter guild description"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">Max Members</label>
                      <input
                        type="number"
                        name="maxMember"
                        min="2"
                        max="100"
                        defaultValue="5"
                        className="w-full px-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">Guild Level</label>
                      <input
                        type="number"
                        name="level"
                        min="1"
                        defaultValue="1"
                        className="w-full px-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Emblem URL (Optional)</label>
                    <input
                      type="url"
                      name="emblemUrl"
                      className="w-full px-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 focus:border-amber-400 focus:outline-none"
                      placeholder="https://example.com/emblem.png"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={creatingGuild}
                    className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-medium rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {creatingGuild ? 'Creating...' : 'Create Guild'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {infoOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-950/95 to-purple-900/95 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30 max-w-md w-full">
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                infoSuccess ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {infoSuccess ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-amber-400 mb-2">
                {infoSuccess ? 'Success!' : 'Error'}
              </h3>
              <p className="text-purple-200 mb-4">{infoMessage}</p>
              <button
                onClick={() => setInfoOpen(false)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-medium rounded-lg transition-all duration-300"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
