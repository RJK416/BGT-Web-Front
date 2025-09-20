"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_CONFIG, apiRequest } from '@/config/api';
import { getAuthToken, isAuthenticated } from '@/utils/auth';
import { Tournament, getPhaseDisplayName } from '@/types/tournament';
import UpdateTournamentModal from '@/components/UpdateTournamentModal';

export default function TournamentsPage() {
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const router = useRouter();

  const fetchTournaments = async () => {
    try {
      const token = getAuthToken();
      const res = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_MY_TOURNAMENTS}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const tournamentsData = res.data || res.result || [];
        setTournaments(tournamentsData);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!isAuthenticated()) { router.push('/'); return; }
      await fetchTournaments();
      setLoading(false);
    };
    run();
  }, [router]);

  const handleUpdateTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setShowUpdateModal(true);
  };

  const handleUpdateSuccess = () => {
    fetchTournaments(); // Refresh the tournaments list
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-amber-400">Your Tournaments</h1>
          <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-purple-900 rounded-lg">
            Back to Dashboard
          </button>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-purple-200">No tournaments yet.</div>
        ) : (
          <div className="space-y-3">
            {tournaments.map(t => (
              <div key={t.id} className="bg-purple-900/50 rounded-lg p-4 border border-amber-400/20 flex items-center justify-between">
                <div>
                  <div className="text-amber-300 font-semibold">{t.name}</div>
                  <div className="text-purple-300 text-sm">{t.game} • {new Date(t.tournamentDate).toLocaleDateString()} • {t.memberCount}/{t.maxMembers}</div>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      t.phase === 0 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                        : t.phase === 1
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                        : t.phase === 2
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                        : t.phase === 3
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                        : 'bg-red-500/20 text-red-300 border border-red-400/30'
                    }`}>
                      {getPhaseDisplayName(t.phase)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-400/30 text-xs hover:bg-blue-500/30 transition-colors" 
                    onClick={() => handleUpdateTournament(t)}
                  >
                    Edit
                  </button>
                  <button 
                    className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded border border-amber-400/30 text-xs hover:bg-amber-500/30 transition-colors" 
                    onClick={() => router.push(`/tournaments/${t.id}`)}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTournament && (
        <UpdateTournamentModal
          tournament={selectedTournament}
          isOpen={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedTournament(null);
          }}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
 