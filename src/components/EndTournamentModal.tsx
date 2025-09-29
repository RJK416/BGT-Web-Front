"use client";

import { useState } from 'react';
import { API_CONFIG, apiRequest } from '@/config/api';
import { getAuthToken } from '@/utils/auth';
import { UpdateBoardgameTournamentRequest, Tournament, TournamentPhase, TournamentMember } from '@/types/tournament';

interface EndTournamentModalProps {
  tournament: Tournament;
  tournamentMembers: TournamentMember[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EndTournamentModal({ 
  tournament, 
  tournamentMembers,
  isOpen, 
  onClose, 
  onSuccess 
}: EndTournamentModalProps) {
  const [formData, setFormData] = useState<UpdateBoardgameTournamentRequest>({
    tournamentId: tournament.id,
    winnerId: tournament.winnerId,
    mvpId: tournament.mvpId,
    phase: TournamentPhase.Finished, // Automatically set to Finished
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate that winner is selected
    if (!formData.winnerId) {
      setError('Please select a winner');
      setLoading(false);
      return;
    }

    try {
      const token = getAuthToken();
      const requestBody = {
        TournamentId: formData.tournamentId,
        WinnerId: formData.winnerId,
        MvpId: formData.mvpId ?? null,
        Phase: formData.phase,
      };
      
      console.log('Sending end tournament request:', requestBody);
      
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
        console.error('End tournament failed:', response);
        if (response.errors) {
          // Handle validation errors
          const errorMessages = Object.values(response.errors).flat();
          setError(`Validation errors: ${errorMessages.join(', ')}`);
        } else {
          const errorMsg = response.message || response.error || 'Failed to end tournament';
          // Check for specific error messages
          if (errorMsg.includes('Only GMs can update tournaments') || errorMsg.includes('GM')) {
            setError('Only Game Masters (GMs) can end tournaments. Please contact an administrator.');
          } else {
            setError(errorMsg);
          }
        }
      }
    } catch (err) {
      setError('An error occurred while ending the tournament');
      console.error('End tournament error:', err);
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
      <div className="bg-gradient-to-br from-purple-950/95 to-purple-900/95 backdrop-blur-sm rounded-xl border-4 border-sky-200/70 shadow-2xl shadow-sky-200/20 p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-amber-400">Finish Tournament</h2>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 p-3 bg-purple-900/30 border border-purple-400/30 rounded">
          <p className="text-purple-200 text-sm">
            <strong>Note:</strong> This action will finish the tournament and mark it as completed. 
            Make sure to select the winner and MVP before proceeding.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-amber-300 text-sm font-medium mb-1">
              Winner <span className="text-amber-400">*</span>
            </label>
            <select
              value={formData.winnerId || ''}
              onChange={(e) => handleInputChange('winnerId', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-purple-900/50 border border-amber-400/30 rounded text-white focus:border-amber-400 focus:outline-none"
              required
            >
              <option value="">Select Winner</option>
              {tournamentMembers.map((member) => (
                <option key={member.id} value={member.playerId}>
                  {member.nickname}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-amber-300 text-sm font-medium mb-1">
              MVP (Most Valuable Player)
            </label>
            <select
              value={formData.mvpId ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                const parsed = val ? parseInt(val) : undefined;
                handleInputChange('mvpId', parsed);
              }}
              className="w-full px-3 py-2 bg-purple-900/50 border border-amber-400/30 rounded text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="">Select MVP (Optional)</option>
              {tournamentMembers.map((member) => (
                <option key={member.id} value={member.playerId}>
                  {member.nickname}
                </option>
              ))}
            </select>
          </div>

          <div className="text-purple-200 text-xs">
            <p>• The tournament will be marked as <strong>Finished</strong></p>
            <p>• Winner will receive {tournament.xpReward} XP</p>
            {formData.mvpId && <p>• MVP will receive {tournament.mvpXpReward} XP</p>}
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
              {loading ? 'Finishing Tournament...' : 'Finish Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
