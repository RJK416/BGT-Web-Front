'use client';

import React, { useState } from 'react';
import { guildService } from '@/services/guildService';

interface AppointGMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentGuildMembers: any[];
}

export default function AppointGMModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  currentGuildMembers 
}: AppointGMModalProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await guildService.appointGM({ Username: username.trim() });
      
      if (response.isSuccess) {
        onSuccess();
        onClose();
        setUsername('');
      } else {
        setError(response.message || 'Failed to appoint GM');
      }
    } catch (error: any) {
      console.error('Error appointing GM:', error);
      setError(error.message || 'Failed to appoint GM');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-950/95 to-purple-900/95 backdrop-blur-sm rounded-xl border-4 border-amber-400/70 shadow-2xl shadow-amber-400/20 w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-amber-400/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-amber-400">Appoint Game Master</h2>
            <button
              onClick={handleClose}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-amber-300 text-sm mb-2 font-medium">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username to appoint as GM"
                className="w-full px-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Available Members List */}
            {currentGuildMembers.length > 0 && (
              <div>
                <label className="block text-amber-300 text-sm mb-2 font-medium">
                  Available Members
                </label>
                <div className="max-h-32 overflow-y-auto bg-purple-900/50 rounded-lg p-3 space-y-1">
                  {currentGuildMembers.map((member) => (
                    <div
                      key={member.playerId}
                      className="flex items-center justify-between p-2 bg-purple-800/30 rounded hover:bg-purple-700/30 transition-colors"
                    >
                      <span className="text-purple-200 text-sm">{member.playerName}</span>
                      <button
                        type="button"
                        onClick={() => setUsername(member.playerName)}
                        className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !username.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-purple-900 font-medium rounded-lg transition-all duration-300"
              >
                {isLoading ? 'Appointing...' : 'Appoint GM'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
