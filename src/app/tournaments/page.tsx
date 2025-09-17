"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_CONFIG, apiRequest } from '@/config/api';
import { getAuthToken, isAuthenticated } from '@/utils/auth';

export default function TournamentsPage() {
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      if (!isAuthenticated()) { router.push('/'); return; }
      try {
        const token = getAuthToken();
        const res = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_MY_TOURNAMENTS}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setTournaments(res.data || res.result || []);
      } finally { setLoading(false); }
    };
    run();
  }, [router]);

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
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded border border-amber-400/30 text-xs" onClick={() => router.push(`/tournaments/${t.id}`)}>Open</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 