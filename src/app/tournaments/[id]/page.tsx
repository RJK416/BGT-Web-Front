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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-4 sm:p-6 relative overflow-hidden">
      {/* Background decorative shapes */}
      <div className="absolute inset-0 opacity-20 hidden sm:block">
        {/* Geometric shapes */}
        <div className="absolute top-20 left-20 w-20 h-20 border-2 border-amber-400 transform rotate-45 rounded-lg"></div>
        <div className="absolute top-40 right-20 w-16 h-16 border-2 border-amber-300 transform -rotate-12 rounded-full"></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 border-2 border-amber-500 transform rotate-30 rounded-lg"></div>
        <div className="absolute bottom-20 right-40 w-14 h-14 border-2 border-amber-400 transform -rotate-45 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 border-2 border-amber-300 transform rotate-60 rounded-lg"></div>
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-amber-300 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-1/4 left-1/2 w-4 h-4 bg-amber-500 rounded-full animate-pulse delay-1000"></div>
        
        {/* Stars */}
        <div className="absolute inset-0">
          {[...Array(18)].map((_, i) => (
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
        <div className="absolute top-20 left-20 w-3 h-3 bg-cyan-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-32 left-16 w-2 h-2 bg-cyan-200 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-28 left-24 w-3 h-3 bg-cyan-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.8s' }} />
        
        <div className="absolute bottom-40 left-20 w-2 h-2 bg-purple-300 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.8s' }} />
        <div className="absolute bottom-48 left-16 w-3 h-3 bg-purple-200 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.7s' }} />
        <div className="absolute bottom-44 left-24 w-1 h-1 bg-purple-400 rounded-full opacity-100 animate-pulse" style={{ animationDelay: '1.4s' }} />
        
        {/* Cosmic Dust/Nebula */}
        <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-gradient-radial from-cyan-500/6 via-blue-500/3 to-transparent rounded-full blur-xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-32 h-32 bg-gradient-radial from-purple-500/4 via-blue-500/2 to-transparent rounded-full blur-lg animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        
        {/* Shooting Stars */}
        <div className="absolute top-20 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '2.5s' }} />
        <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-cyan-300 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '4s' }} />
      </div>
      
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-amber-400">
              {tournament ? `${tournament.name}` : `Tournament #${id}`} Members
            </h1>
            {tournament && (
              <div className="text-purple-300 text-xs sm:text-sm mt-1">
                {tournament.game} • {new Date(tournament.tournamentDate).toLocaleDateString('en-US')} • {tournament.memberCount}/{tournament.maxMembers} • {tournament.phase}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {tournament && (
              <button 
                onClick={() => setShowUpdateModal(true)} 
                className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors text-sm sm:text-base"
              >
                Edit Tournament
              </button>
            )}
            <button onClick={() => router.push('/tournaments')} className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-purple-900 rounded-lg text-sm sm:text-base">Back</button>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="text-purple-200">No members yet.</div>
        ) : (
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="bg-purple-900/50 rounded-lg p-3 sm:p-4 border border-amber-400/20 flex items-center justify-between gap-2">
                <div> 
                  <div className="text-amber-300 font-semibold">{m.nickname}</div>
                  <div className="text-purple-300 text-xs sm:text-sm">Joined: {new Date(m.joinedAt).toLocaleString()}</div>
                </div>
                <div className="text-purple-200 text-xs sm:text-sm whitespace-nowrap">{m.placement ? `#${m.placement}` : '—'} {typeof m.score === 'number' ? `• ${m.score} pts` : ''}</div>
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
 