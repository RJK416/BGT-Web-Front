"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_CONFIG, apiRequest } from '@/config/api';
import { isAuthenticated, getAuthToken } from '@/utils/auth';
import { Tournament, TournamentMember } from '@/types/tournament';
import UpdateTournamentModal from '@/components/UpdateTournamentModal';

export default function TournamentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const [members, setMembers] = useState<TournamentMember[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const fetchTournamentData = async () => {
    try {
      const token = getAuthToken();
      
      // Fetch tournament details from my tournaments
      const tournamentsRes = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_MY_TOURNAMENTS}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (tournamentsRes.ok) {
        const tournaments = tournamentsRes.data || tournamentsRes.result || [];
        const currentTournament = tournaments.find((t: Tournament) => t.id === parseInt(id));
        if (currentTournament) {
          setTournament(currentTournament);
        }
      }

      // Fetch tournament members
      const membersRes = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_TOURNAMENT_MEMBERS}/${id}`, {
        method: 'GET'
      });
      if (membersRes.ok) setMembers(membersRes.data || membersRes.result || []);
    } catch (error) {
      console.error('Error fetching tournament data:', error);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!isAuthenticated()) { router.push('/'); return; }
      await fetchTournamentData();
      setLoading(false);
    };
    if (id) run();
  }, [id, router]);

  const handleUpdateSuccess = () => {
    fetchTournamentData(); // Refresh the tournament data
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-amber-400">
              {tournament ? `${tournament.name}` : `Tournament #${id}`} Members
            </h1>
            {tournament && (
              <div className="text-purple-300 text-sm mt-1">
                {tournament.game} • {new Date(tournament.tournamentDate).toLocaleDateString()} • {tournament.memberCount}/{tournament.maxMembers} • {tournament.phase}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {tournament && (
              <button 
                onClick={() => setShowUpdateModal(true)} 
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors"
              >
                Edit Tournament
              </button>
            )}
            <button onClick={() => router.push('/tournaments')} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-purple-900 rounded-lg">Back</button>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="text-purple-200">No members yet.</div>
        ) : (
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="bg-purple-900/50 rounded-lg p-4 border border-amber-400/20 flex items-center justify-between">
                <div> 
                  <div className="text-amber-300 font-semibold">{m.nickname}</div>
                  <div className="text-purple-300 text-sm">Joined: {new Date(m.joinedAt).toLocaleString()}</div>
                </div>
                <div className="text-purple-200 text-sm">{m.placement ? `#${m.placement}` : '—'} {typeof m.score === 'number' ? `• ${m.score} pts` : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tournament && (
        <UpdateTournamentModal
          tournament={tournament}
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
 