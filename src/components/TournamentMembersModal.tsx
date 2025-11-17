"use client";

import { useState, useEffect } from 'react';
import { API_CONFIG, apiRequest } from '@/config/api';
import { TournamentMember } from '@/types/tournament';
import { getAuthToken } from '@/utils/auth';
import ConfirmModal from '@/components/ConfirmModal';

interface TournamentMembersModalProps {
  tournamentId: number;
  tournamentName: string;
  isOpen: boolean;
  onClose: () => void;
  onMemberRemoved?: () => void;
}

export default function TournamentMembersModal({ 
  tournamentId,
  tournamentName,
  isOpen, 
  onClose,
  onMemberRemoved
}: TournamentMembersModalProps) {
  const [members, setMembers] = useState<TournamentMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<TournamentMember | null>(null);

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

  const removeMember = (member: TournamentMember) => {
    setPendingRemoval(member);
    setConfirmOpen(true);
  };

  const confirmRemoval = async () => {
    const member = pendingRemoval;
    if (!member) return;
    setRemovingMember(member.id);
    try {
      const token = getAuthToken();
      const res = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.REMOVE_TOURNAMENT_MEMBER}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          TournamentId: tournamentId,
          Username: member.nickname
        })
      });

      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== member.id));
        onMemberRemoved?.();
        setConfirmOpen(false);
        setPendingRemoval(null);
      } else {
        setError(res.error || res.message || 'Failed to remove member');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
      console.error('Remove member error:', err);
    } finally {
      setRemovingMember(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="medieval-panel rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#9C6B3E]/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#F4EBD0] medieval-heading" style={{ textTransform: 'none' }}>Tournament Members</h2>
              <p className="text-[#d4b077] text-sm mt-1">{tournamentName}</p>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                background: 'rgba(128, 44, 44, 0.2)',
                border: '1px solid rgba(156, 107, 62, 0.5)',
                borderRadius: '8px',
                color: '#e8a8a8',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
              className="hover:bg-red-500/30"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)] custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E7B45D]" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-[#e8a8a8] text-lg mb-2" style={{ textTransform: 'none' }}>Error Loading Members</div>
              <div className="text-[#B6AA96] text-sm mb-4">{error}</div>
              <button
                onClick={fetchMembers}
                style={{
                  padding: '10px 16px',
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
                Try Again
              </button>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[#F4EBD0] text-lg" style={{ textTransform: 'none' }}>No Members Yet</div>
              <div className="text-[#B6AA96] text-sm mt-2" style={{ textTransform: 'none' }}>Members will appear here when they join the tournament</div>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} style={{
                  background: 'linear-gradient(180deg, rgba(28, 18, 12, 0.98) 0%, rgba(20, 12, 8, 0.99) 100%)',
                  border: '1px solid rgba(78, 49, 28, 0.7)',
                  borderRadius: '12px',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 14px 28px rgba(0, 0, 0, 0.7)',
                  padding: '16px'
                }} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar Circle */}
                    <div className="relative">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.nickname}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '9999px',
                            border: '1px solid rgba(231, 180, 93, 0.7)',
                            boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)'
                          }}
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${member.avatarUrl ? 'hidden' : ''}`} style={{
                        background: 'radial-gradient(circle at 35% 25%, #f1c980 0%, #b37a3c 55%, #7a4a21 100%)',
                        border: '1px solid rgba(231, 180, 93, 0.7)',
                        boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)'
                      }}>
                        <span className="text-lg font-bold text-[#2a1d12]">
                          {member.nickname.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Member Info */}
                    <div>
                      <div className="text-[#F4EBD0] font-semibold">{member.nickname}</div>
                      <div className="text-[#B6AA96] text-sm" style={{ textTransform: 'none' }}>
                        Joined: {new Date(member.joinedAt).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Member Stats and Remove Button */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      {member.placement && (
                        <div className="text-[#d4b077] font-bold text-lg">
                          #{member.placement}
                        </div>
                      )}
                      {typeof member.score === 'number' && (
                        <div className="text-[#B6AA96] text-sm">
                          {member.score} pts
                        </div>
                      )}
                      {!member.placement && !member.score && (
                        <div className="text-[#B6AA96] text-sm" style={{ textTransform: 'none' }}>
                          Participant
                        </div>
                      )}
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeMember(member)}
                      disabled={removingMember === member.id}
                      style={{
                        padding: '8px',
                        color: '#e8a8a8',
                        transition: 'all 0.3s',
                        cursor: removingMember === member.id ? 'not-allowed' : 'pointer',
                        opacity: removingMember === member.id ? 0.5 : 1
                      }}
                      className="hover:text-red-300"
                      title="Remove member from tournament"
                    >
                      {removingMember === member.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-[#9C6B3E]/50">
          <div className="flex justify-between items-center">
            <div className="text-[#B6AA96] text-sm" style={{ textTransform: 'none' }}>
              {members.length} member{members.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '10px 16px',
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
              Close
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmOpen}
        title="Remove Member"
        description={pendingRemoval ? `Are you sure you want to remove ${pendingRemoval.nickname} from this tournament?` : ''}
        confirmText="Remove"
        cancelText="Cancel"
        danger
        loading={removingMember != null}
        onConfirm={confirmRemoval}
        onCancel={() => { setConfirmOpen(false); setPendingRemoval(null); }}
      />
    </div>
  );
}
