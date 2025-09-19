"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_CONFIG, apiRequest } from '@/config/api';
import { isAuthenticated } from '@/utils/auth';

export default function TournamentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!isAuthenticated()) { router.push('/'); return; }
      try {
        const res = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_TOURNAMENT_MEMBERS}/${id}`, {
          method: 'GET'
        });
        if (res.ok) setMembers(res.data || res.result || []);
      } finally { setLoading(false); }
    };
    if (id) run();
  }, [id, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-amber-400">Tournament #{id} Members</h1>
          <button onClick={() => router.push('/tournaments')} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-purple-900 rounded-lg">Back</button>
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
    </div>
  );
}
 