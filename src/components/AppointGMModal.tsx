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
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setError('Please select a member to appoint as GM');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the new username-based appoint method
      const response = await guildService.appointGMByUsername(selectedMember.playerName);
      
      if (response.isSuccess && response.status === 200) {
        onSuccess();
        onClose();
        setSelectedMember(null);
      } else {
        setError((response as any).error || response.message || 'Failed to appoint GM');
      }
    } catch (error: any) {
      console.error('Error appointing GM:', error);
      setError(error.message || 'Failed to appoint GM');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedMember(null);
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

            {/* Available Members List */}
            {currentGuildMembers.length > 0 && (
              <div>
                <label className="block text-amber-300 text-sm mb-2 font-medium">
                  Select Member to Appoint as GM
                </label>
                <div className="max-h-48 overflow-y-auto bg-purple-900/50 rounded-lg p-3 space-y-2">
                  {currentGuildMembers.map((member) => (
                    <div
                      key={member.playerId}
                      className={`flex items-center justify-between p-3 rounded transition-colors cursor-pointer ${
                        selectedMember?.playerId === member.playerId
                          ? 'bg-amber-500/30 border-2 border-amber-400'
                          : 'bg-purple-800/30 hover:bg-purple-700/30 border-2 border-transparent'
                      }`}
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.playerName}
                              className="w-8 h-8 rounded-full object-cover border border-amber-400"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-purple-900 font-bold text-sm ${member.avatarUrl ? 'hidden' : ''}`}>
                            {member.playerName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <span className="text-purple-200 font-medium">{member.playerName}</span>
                          <div className="text-purple-400 text-xs">Level {member.playerLevel || 'N/A'}</div>
                        </div>
                      </div>
                      {selectedMember?.playerId === member.playerId && (
                        <div className="text-amber-400">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {selectedMember && (
                  <div className="mt-3 p-3 bg-amber-500/20 border border-amber-400/50 rounded-lg">
                    <p className="text-amber-300 text-sm">
                      <strong>Selected:</strong> {selectedMember.playerName}
                    </p>
                  </div>
                )}
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
                disabled={isLoading || !selectedMember}
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
