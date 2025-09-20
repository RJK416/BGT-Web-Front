"use client";

import { useState } from 'react';
import { API_CONFIG, apiRequest } from '@/config/api';
import { getAuthToken } from '@/utils/auth';
import { UpdateBoardgameTournamentRequest, Tournament, TournamentPhase } from '@/types/tournament';

interface UpdateTournamentModalProps {
  tournament: Tournament;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UpdateTournamentModal({ 
  tournament, 
  isOpen, 
  onClose, 
  onSuccess 
}: UpdateTournamentModalProps) {
  const [formData, setFormData] = useState<UpdateBoardgameTournamentRequest>({
    tournamentId: tournament.id,
    name: tournament.name,
    game: tournament.game,
    tournamentDate: new Date(tournament.tournamentDate),
    maxMembers: tournament.maxMembers,
    memberCount: tournament.memberCount,
    xpReward: tournament.xpReward,
    mvpXpReward: tournament.mvpXpReward,
    phase: tournament.phase,
    winnerId: tournament.winnerId,
    mvpId: tournament.mvpId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate date is not in the past
    if (formData.tournamentDate && formData.tournamentDate < new Date()) {
      setError('Tournament date cannot be in the past');
      setLoading(false);
      return;
    }

    try {
      const token = getAuthToken();
      const requestBody = {
        TournamentId: formData.tournamentId,
        Name: formData.name,
        Game: formData.game,
        TournamentDate: formData.tournamentDate?.toISOString(),
        MaxMembers: formData.maxMembers,
        MemberCount: formData.memberCount,
        XpReward: formData.xpReward,
        MvpXpReward: formData.mvpXpReward,
        Phase: formData.phase,
        WinnerId: formData.winnerId,
        MvpId: formData.mvpId,
      };
      
      console.log('Sending update request:', requestBody);
      
      const response = await apiRequest(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.UPDATE_TOURNAMENT}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        console.error('Update tournament failed:', response);
        if (response.errors) {
          // Handle validation errors
          const errorMessages = Object.values(response.errors).flat();
          setError(`Validation errors: ${errorMessages.join(', ')}`);
        } else {
          const errorMsg = response.message || response.error || 'Failed to update tournament';
          // Check for specific error messages
          if (errorMsg.includes('Only GMs can update tournaments') || errorMsg.includes('GM')) {
            setError('Only Game Masters (GMs) can update tournaments. Please contact an administrator.');
          } else if (errorMsg.includes('Tournament date cannot be earlier than today')) {
            setError('Tournament date cannot be in the past. Please select a future date.');
          } else if (errorMsg.includes('cannot be empty')) {
            setError('Name and Game fields cannot be empty.');
          } else {
            setError(errorMsg);
          }
        }
      }
    } catch (err) {
      setError('An error occurred while updating the tournament');
      console.error('Update tournament error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateBoardgameTournamentRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 w-full max-w-md border border-amber-400/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-amber-400">Update Tournament</h2>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-amber-300 text-sm font-medium mb-1">
              Tournament Name
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-purple-900/50 border border-amber-400/30 rounded text-white placeholder-purple-300 focus:border-amber-400 focus:outline-none"
              placeholder="Enter tournament name"
            />
          </div>

          <div>
            <label className="block text-amber-300 text-sm font-medium mb-1">
              Game
            </label>
            <input
              type="text"
              value={formData.game || ''}
              onChange={(e) => handleInputChange('game', e.target.value)}
              className="w-full px-3 py-2 bg-purple-900/50 border border-amber-400/30 rounded text-white placeholder-purple-300 focus:border-amber-400 focus:outline-none"
              placeholder="Enter game name"
            />
          </div>

          <div>
            <label className="block text-amber-300 text-sm font-medium mb-1">
              Tournament Date
            </label>
            <input
              type="datetime-local"
              value={formData.tournamentDate ? new Date(formData.tournamentDate).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleInputChange('tournamentDate', new Date(e.target.value))}
              className="w-full px-3 py-2 bg-purple-900/50 border border-amber-400/30 rounded text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-amber-300 text-sm font-medium mb-1">
              Max Members
            </label>
            <input
              type="number"
              min="1"
              value={formData.maxMembers || ''}
              onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-purple-900/50 border border-amber-400/30 rounded text-white placeholder-purple-300 focus:border-amber-400 focus:outline-none"
              placeholder="Maximum number of members"
            />
          </div>

          <div>
            <label className="block text-amber-300 text-sm font-medium mb-1">
              XP Reward
            </label>
            <input
              type="number"
              min="0"
              value={formData.xpReward || ''}
              onChange={(e) => handleInputChange('xpReward', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-purple-900/50 border border-amber-400/30 rounded text-white placeholder-purple-300 focus:border-amber-400 focus:outline-none"
              placeholder="XP reward amount"
            />
          </div>

          <div>
            <label className="block text-amber-300 text-sm font-medium mb-1">
              MVP XP Reward
            </label>
            <input
              type="number"
              min="0"
              value={formData.mvpXpReward || ''}
              onChange={(e) => handleInputChange('mvpXpReward', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-purple-900/50 border border-amber-400/30 rounded text-white placeholder-purple-300 focus:border-amber-400 focus:outline-none"
              placeholder="MVP XP reward amount"
            />
          </div>

          <div>
            <label className="block text-amber-300 text-sm font-medium mb-1">
              Phase
            </label>
            <select
              value={formData.phase || ''}
              onChange={(e) => handleInputChange('phase', parseInt(e.target.value) as TournamentPhase)}
              className="w-full px-3 py-2 bg-purple-900/50 border border-amber-400/30 rounded text-white focus:border-amber-400 focus:outline-none"
            >
              <option value={TournamentPhase.Registration}>Registration</option>
              <option value={TournamentPhase.Started}>Started</option>
              <option value={TournamentPhase.Finished}>Finished</option>
              <option value={TournamentPhase.Postponed}>Postponed</option>
              <option value={TournamentPhase.Cancelled}>Cancelled</option>
            </select>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-400/30 rounded p-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-purple-700/50 text-purple-200 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-purple-900 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
