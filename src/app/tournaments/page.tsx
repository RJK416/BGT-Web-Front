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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-4 sm:p-6 relative overflow-hidden">
      {/* Background decorative shapes */}
      <div className="absolute inset-0 opacity-20 hidden sm:block">
        {/* Geometric shapes */}
        <div className="absolute top-20 left-20 w-24 h-24 border-2 border-amber-400 transform rotate-45 rounded-lg"></div>
        <div className="absolute top-40 right-20 w-20 h-20 border-2 border-amber-300 transform -rotate-12 rounded-full"></div>
        <div className="absolute bottom-40 left-20 w-28 h-28 border-2 border-amber-500 transform rotate-30 rounded-lg"></div>
        <div className="absolute bottom-20 right-40 w-16 h-16 border-2 border-amber-400 transform -rotate-45 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-18 h-18 border-2 border-amber-300 transform rotate-60 rounded-lg"></div>
        <div className="absolute top-1/3 right-1/4 w-14 h-14 border-2 border-amber-500 transform -rotate-30 rounded-full"></div>
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-amber-300 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-1/4 left-1/2 w-4 h-4 bg-amber-500 rounded-full animate-pulse delay-300"></div>
        
        {/* Stars */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Star Clusters */}
        <div className="absolute top-24 left-24 w-3 h-3 bg-cyan-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-36 left-20 w-2 h-2 bg-cyan-200 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-32 left-28 w-3 h-3 bg-cyan-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.8s' }} />
        
        <div className="absolute bottom-40 left-24 w-2 h-2 bg-purple-300 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.8s' }} />
        <div className="absolute bottom-48 left-20 w-3 h-3 bg-purple-200 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.7s' }} />
        <div className="absolute bottom-44 left-28 w-1 h-1 bg-purple-400 rounded-full opacity-100 animate-pulse" style={{ animationDelay: '1.4s' }} />
        
        {/* Cosmic Dust/Nebula */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-radial from-cyan-500/8 via-blue-500/4 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-radial from-purple-500/6 via-blue-500/3 to-transparent rounded-full blur-xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        
        {/* Shooting Stars */}
        <div className="absolute top-24 left-1/3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '2.5s' }} />
        <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-cyan-300 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '4s' }} />
        
        {/* Pegasus Constellation */}
        <div className="absolute top-1/3 right-1/4 opacity-60">
          <div className="absolute w-2 h-2 bg-white rounded-full top-0 left-0"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full top-0 left-6"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full top-4 left-0"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full top-4 left-6"></div>
          <div className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full top-2 left-12"></div>
          {/* Connecting lines */}
          <div className="absolute w-6 h-px bg-blue-400/30 top-1 left-0"></div>
          <div className="absolute w-6 h-px bg-blue-400/30 top-5 left-0"></div>
          <div className="absolute w-6 h-px bg-blue-400/30 top-3 left-12 rotate-12"></div>
        </div>
        
        {/* Aquila (Eagle) */}
        <div className="absolute bottom-1/3 right-1/3 opacity-60">
          <div className="absolute w-2 h-2 bg-purple-300 rounded-full top-0 left-4"></div>
          <div className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full top-3 left-0"></div>
          <div className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full top-3 left-8"></div>
          <div className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full top-6 left-4"></div>
          {/* Connecting lines */}
          <div className="absolute w-4 h-px bg-purple-400/30 top-1 left-4"></div>
          <div className="absolute w-8 h-px bg-purple-400/30 top-4 left-0"></div>
          <div className="absolute w-4 h-px bg-purple-400/30 top-7 left-4"></div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-amber-400">Your Tournaments</h1>
          <button onClick={() => router.push('/dashboard')} className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-purple-900 rounded-lg text-sm sm:text-base">
            Back to Dashboard
          </button>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-purple-200">No tournaments yet.</div>
        ) : (
          <div className="space-y-3">
            {tournaments.map(t => (
              <div key={t.id} className="bg-purple-900/50 rounded-lg p-3 sm:p-4 border border-amber-400/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-amber-300 font-semibold truncate">{t.name}</div>
                  <div className="text-purple-300 text-xs sm:text-sm truncate">{t.game} • {new Date(t.tournamentDate).toLocaleDateString()} • {t.memberCount}/{t.maxMembers}</div>
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
                <div className="flex items-center gap-2 sm:self-end sm:self-auto">
                  <button className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-400/30 text-xs hover:bg-blue-500/30 transition-colors" onClick={() => handleUpdateTournament(t)}>Edit</button>
                  <button className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded border border-amber-400/30 text-xs hover:bg-amber-500/30 transition-colors" onClick={() => router.push(`/tournaments/${t.id}`)}>Open</button>
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
 