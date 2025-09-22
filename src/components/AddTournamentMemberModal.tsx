"use client";

import { useState } from 'react';
import { API_CONFIG, apiRequest } from '@/config/api';
import { getAuthToken } from '@/utils/auth';

interface AddTournamentMemberModalProps {
  tournamentId: number;
  tournamentName?: string;
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

export default function AddTournamentMemberModal({
  tournamentId,
  tournamentName,
  isOpen,
  onClose,
  onAdded
}: AddTournamentMemberModalProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getAuthToken();
      const res = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.ADD_TOURNAMENT_MEMBER}` , {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          TournamentId: tournamentId,
          Username: username.trim()
        })
      });

      if (res.ok) {
        setSuccess(res.message || 'Member added');
        setUsername('');
        onAdded?.();
      } else {
        setError(res.error || res.message || 'Failed to add member');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-gradient-to-br from-purple-950/95 to-purple-900/95 backdrop-blur-sm rounded-xl border-4 border-sky-200/70 shadow-2xl shadow-sky-200/20 w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-sky-200/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-amber-400">Add Tournament Member</h2>
              {tournamentName && (
                <p className="text-purple-300 text-sm">{tournamentName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-purple-300 hover:text-white transition-colors text-2xl"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-500/10 text-red-300 border border-red-400/30 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="px-3 py-2 bg-green-500/10 text-green-300 border border-green-400/30 rounded">
              {success}
            </div>
          )}

          <div>
            <label className="block text-amber-300 text-sm mb-1">Player username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. john_doe"
              className="w-full pl-3 pr-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-purple-800/50 hover:bg-purple-800/70 text-purple-100 rounded-lg border border-purple-500/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-500 disabled:to-gray-600 text-purple-900 rounded-lg font-medium"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


