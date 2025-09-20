"use client";

import { useState, useEffect } from 'react';
import { API_CONFIG, apiRequest } from '@/config/api';
import { TournamentMember } from '@/types/tournament';

interface TournamentMembersModalProps {
  tournamentId: number;
  tournamentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TournamentMembersModal({ 
  tournamentId,
  tournamentName,
  isOpen, 
  onClose
}: TournamentMembersModalProps) {
  const [members, setMembers] = useState<TournamentMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch members when modal opens
  useEffect(() => {
    if (isOpen && tournamentId) {
      fetchMembers();
    }
  }, [isOpen, tournamentId]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_TOURNAMENT_MEMBERS}/${tournamentId}`, {
        method: 'GET'
      });
      
      if (res.ok) {
        setMembers(res.data || res.result || []);
      } else {
        setError(res.message || res.error || 'Failed to load members');
      }
    } catch (err) {
      setError('An error occurred while loading members');
      console.error('Load members error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-gradient-to-br from-purple-950/95 to-purple-900/95 backdrop-blur-sm rounded-xl border-4 border-sky-200/70 shadow-2xl shadow-sky-200/20 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-sky-200/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-amber-400">Tournament Members</h2>
              <p className="text-purple-300">{tournamentName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-purple-300 hover:text-white transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-400 text-lg mb-2">Error Loading Members</div>
              <div className="text-purple-300 text-sm">{error}</div>
              <button
                onClick={fetchMembers}
                className="mt-4 px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-400/30 hover:bg-amber-500/30 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-purple-300 text-lg">No Members Yet</div>
              <div className="text-purple-400 text-sm mt-2">Members will appear here when they join the tournament</div>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="bg-purple-800/40 rounded-lg p-4 border border-sky-200/20 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar Circle */}
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-purple-900 font-bold text-lg">
                      {member.nickname.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Member Info */}
                    <div>
                      <div className="text-amber-300 font-semibold">{member.nickname}</div>
                      <div className="text-purple-300 text-sm">
                        Joined: {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Member Stats */}
                  <div className="text-right">
                    {member.placement && (
                      <div className="text-amber-400 font-bold text-lg">
                        #{member.placement}
                      </div>
                    )}
                    {typeof member.score === 'number' && (
                      <div className="text-purple-300 text-sm">
                        {member.score} pts
                      </div>
                    )}
                    {!member.placement && !member.score && (
                      <div className="text-purple-400 text-sm">
                        Participant
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-sky-200/20">
          <div className="flex justify-between items-center">
            <div className="text-purple-300 text-sm">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
