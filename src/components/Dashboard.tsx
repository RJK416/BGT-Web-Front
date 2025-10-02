'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken, getUserFromToken, isAuthenticated } from '@/utils/auth';
import { API_CONFIG, apiRequest } from '@/config/api';
import Leaderboard from '@/components/Leaderboard';
import UpdateTournamentModal from '@/components/UpdateTournamentModal';
import EndTournamentModal from '@/components/EndTournamentModal';
import TournamentMembersModal from '@/components/TournamentMembersModal';
import AddTournamentMemberModal from '@/components/AddTournamentMemberModal';
import { getPhaseDisplayName } from '@/types/tournament';
import ConfirmModal from '@/components/ConfirmModal';
import InfoModal from '@/components/InfoModal';

// ✅ Keep this type if you want typed access to extended claims
type MyJwtPayload = import('jwt-decode').JwtPayload & {
  name?: string;
  unique_name?: string;
  email?: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [myTournaments, setMyTournaments] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPlayer, setUserPlayer] = useState<any>(null);
  const isGM = (() => {
    const r = userPlayer?.role;
    if (r == null) return false;
    if (typeof r === 'string') return r.toUpperCase() === 'GM';
    return r === 1; // numeric enum fallback
  })();
  const [userPlayerLoading, setUserPlayerLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isCreateTournamentExpanded, setIsCreateTournamentExpanded] = useState(false);

  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [tournamentMembers, setTournamentMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addPlayerUsername, setAddPlayerUsername] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [isFromMyTournaments, setIsFromMyTournaments] = useState(false);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [membersModalTournament, setMembersModalTournament] = useState<{ id: number; name: string } | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<any | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(true);
  const [infoMessage, setInfoMessage] = useState<string | undefined>(undefined);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<{url: string, nickname: string} | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const router = useRouter();

  // --- fetchers (unchanged logic, shown for completeness) ---
  const fetchTournaments = async () => {
    try {
      setTournamentsLoading(true);
      const response = await apiRequest(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_TOURNAMENTS_WITH_GM}?page=1&pageSize=10`,
        { method: 'GET' }
      );

      if (response.ok && response.status === 200) {
        setTournaments(response.items || response.data?.items || []);
      } else {
        console.error('Failed to fetch tournaments:', response);
        setTournaments([]);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setTournaments([]);
    } finally {
      setTournamentsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        setUserProfile(null);
        return;
      }
      const response = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNT.GET_PROFILE}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok && response.status === 200) {
        setUserProfile(response.data);
        // Also set userPlayer from the profile stats for backward compatibility
        if (response.data?.stats) {
          setUserPlayer({
            ...response.data.stats,
            totalScore: response.data.stats.xp || 0, // Use XP as total score for now
          });
        }
      } else {
        console.error('Failed to fetch user profile:', response);
        setUserProfile(null);
        setUserPlayer(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
      setUserPlayer(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchUserPlayer = async () => {
    try {
      setUserPlayerLoading(true);
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        setUserPlayer(null);
        return;
      }
      const response = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_USER_PLAYER}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok && response.status === 200) {
        setUserPlayer(response.data);
      } else {
        console.error('Failed to fetch user player:', response);
        setUserPlayer(null);
      }
    } catch (error) {
      console.error('Error fetching user player:', error);
      setUserPlayer(null);
    } finally {
      setUserPlayerLoading(false);
    }
  };

  // Avatar upload function
  const handleAvatarUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setInfoSuccess(false);
      setInfoMessage('Please select a valid image file (JPG, PNG, or WebP)');
      setInfoOpen(true);
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setInfoSuccess(false);
      setInfoMessage('File size must be less than 5MB');
      setInfoOpen(true);
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNT.UPLOAD_AVATAR}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.status === 200) {
        setInfoSuccess(true);
        setInfoMessage('Avatar uploaded successfully!');
        setInfoOpen(true);
        // Refresh profile to show new avatar
        await fetchUserProfile();
      } else {
        throw new Error(result.error || result.message || 'Failed to upload avatar');
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setInfoSuccess(false);
      setInfoMessage(error.message || 'Failed to upload avatar');
      setInfoOpen(true);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarClick = (avatarUrl: string, nickname: string) => {
    setSelectedAvatar({ url: avatarUrl, nickname });
    setIsAvatarModalOpen(true);
  };

  const handleAvatarModalClose = () => {
    setIsAvatarModalOpen(false);
    setSelectedAvatar(null);
  };

  // Remove player confirm flow
  const promptRemoveMember = (member: any) => {
    setPendingRemoval(member);
    setConfirmOpen(true);
  };

  const removeMemberFromTournament = async () => {
    const member = pendingRemoval;
    if (!selectedTournament || !member) return;

    setRemovingMemberId(member.id);
    try {
      const token = getAuthToken();
      const res = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.REMOVE_TOURNAMENT_MEMBER}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          TournamentId: selectedTournament.id,
          Username: member.nickname
        })
      });

      if (res.ok) {
        setTournamentMembers(prev => prev.filter((m: any) => m.id !== member.id));
        fetchMyTournaments();
        fetchTournaments();
        setConfirmOpen(false);
        setPendingRemoval(null);
      } else {
        setInfoSuccess(false);
        setInfoMessage(res.error || res.message || 'Failed to remove member');
        setInfoOpen(true);
      }
    } catch (error: any) {
      setInfoSuccess(false);
      setInfoMessage(error.message || 'Failed to remove member');
      setInfoOpen(true);
    } finally {
      setRemovingMemberId(null);
    }
  };

  // ✅ Fixed useEffect: single place to do auth, set user, then fetch data
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/');
        return;
      }

      try {
        const jwtToken = getAuthToken();
        const userFromToken = getUserFromToken();

        if (!jwtToken || !userFromToken) {
          removeAuthToken();
          router.push('/');
          return;
        }

        const typed = userFromToken as MyJwtPayload;

        console.log('🔍 Decoded JWT token:', typed);
        console.log('🔍 Available claims:', Object.keys(typed as Record<string, unknown>));
        console.log('🔍 name claim:', typed.name);
        console.log('🔍 unique_name claim:', typed.unique_name);
        console.log('🔍 sub claim:', typed.sub);
        console.log('🔍 email claim:', typed.email);

        setUser({
          username: typed.name ?? typed.unique_name ?? typed.sub ?? 'User',
          email: typed.email ?? 'user@realm.com',
          joinDate: '2024-01-15',
        });

        await Promise.all([fetchUserPlayer(), fetchUserProfile(), fetchTournaments()]);
      } finally {
        setIsLoading(false);
      }
    };


    checkAuth();
  }, [router]); 

  // Function to fetch my tournaments
  const fetchMyTournaments = async () => {
    if (!userPlayer || !isGM) return;
    
    try {
      const token = getAuthToken();
      
      const res = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_MY_TOURNAMENTS_WITH_GM}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const tournaments = res.data || res.result || [];
        setMyTournaments(tournaments);
      }
    } catch (error) {
      // Error handling for tournament fetching
    }
  };


  function CreateTournamentForm() {
  const [name, setName] = useState('');
  const [game, setGame] = useState('');
  const [tournamentDate, setTournamentDate] = useState('');
  const [maxMembers, setMaxMembers] = useState<number>(8);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [xpReward, setXpReward] = useState<number>(100);
  const [mvpXpReward, setMvpXpReward] = useState<number>(50);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const parseEuropeanDateToIsoUtc = (value: string) => {
    const parts = value.trim().split('.');
    if (parts.length !== 3) return '';
    const [dd, mm, yyyy] = parts.map(p => p.trim());
    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    const year = parseInt(yyyy, 10);
    if (!day || !month || !year) return '';
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0)).toISOString();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      const token = getAuthToken();
      const utcIsoDate = parseEuropeanDateToIsoUtc(tournamentDate);
      if (!utcIsoDate) throw new Error('Please enter a valid date as DD.MM.YYYY');
      const body = {
        Name: name,
        Game: game,
        TournamentDate: utcIsoDate,
        MaxMembers: maxMembers,
        MemberCount: memberCount,
        XpReward: xpReward,
        MvpXpReward: mvpXpReward,
      };
      const res = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.CREATE_TOURNAMENT}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(res.error || res.message || 'Failed');
      setMessage(res.message || 'Tournament created');
      setInfoSuccess(true);
      setInfoMessage(res.message || 'Tournament created successfully!');
      setInfoOpen(true);
      setName(''); setGame(''); setTournamentDate(''); setMaxMembers(8); setMemberCount(0); setXpReward(100); setMvpXpReward(50);
      // refresh list if available
      if (typeof fetchMyTournaments === 'function') fetchMyTournaments();
    } catch (err: any) {
      setMessage(err.message || 'Failed to create tournament');
      setInfoSuccess(false);
      setInfoMessage(err.message || 'Failed to create tournament');
      setInfoOpen(true);
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {message && <div className="text-sm text-amber-300">{message}</div>}
      <div>
        <label className="block text-amber-300 text-sm mb-1">Name</label>
        <input value={name} onChange={e=>setName(e.target.value)} className="w-full pl-3 pr-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100" required />
      </div>
      <div>
        <label className="block text-amber-300 text-sm mb-1">Game</label>
        <input value={game} onChange={e=>setGame(e.target.value)} className="w-full pl-3 pr-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100" required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-amber-300 text-sm mb-1">Date (DD.MM.YYYY)</label>
          <input
            type="text"
            placeholder="dd.mm.yyyy"
            value={tournamentDate}
            onChange={e=>setTournamentDate(e.target.value)}
            className="w-full pl-3 pr-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100"
            pattern="^(0?[1-9]|[12][0-9]|3[01])\.(0?[1-9]|1[0-2])\.(19|20)\d{2}$"
            title="Enter date as DD.MM.YYYY"
            required
          />
        </div>
        <div>
          <label className="block text-amber-300 text-sm mb-1">Max Members</label>
          <input type="number" min={1} value={maxMembers} onChange={e=>setMaxMembers(parseInt(e.target.value||'0'))} className="no-spinner w-full pl-3 pr-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100" required />
        </div>
        <div>
          <label className="block text-amber-300 text-sm mb-1">Initial Members</label>
          <input type="number" min={0} value={memberCount} onChange={e=>setMemberCount(parseInt(e.target.value||'0'))} className="no-spinner w-full pl-3 pr-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100" required />
        </div>
        <div>
          <label className="block text-amber-300 text-sm mb-1">XP Reward</label>
          <input type="number" min={0} value={xpReward} onChange={e=>setXpReward(parseInt(e.target.value||'0'))} className="no-spinner w-full pl-3 pr-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100" required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-amber-300 text-sm mb-1">MVP XP Reward</label>
          <input type="number" min={0} value={mvpXpReward} onChange={e=>setMvpXpReward(parseInt(e.target.value||'0'))} className="no-spinner w-full pl-3 pr-3 py-2 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100" required />
        </div>
      </div>
      <button disabled={creating} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-medium rounded-lg">
        {creating ? 'Creating...' : 'Create Tournament'}
      </button>
    </form>
  );
}

  // Fetch my tournaments when userPlayer is loaded and user is GM
  useEffect(() => {
    fetchMyTournaments();
  }, [userPlayer, isGM]);

  // Function to open tournament modal and fetch members
  const openTournamentModal = async (tournament: any, fromMyTournaments: boolean = false) => {
    setSelectedTournament(tournament);
    setIsFromMyTournaments(fromMyTournaments);
    setIsTournamentModalOpen(true);
    setMembersLoading(true);
    
    try {
      const res = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_TOURNAMENT_MEMBERS}/${tournament.id}`, { 
        method: 'GET' 
      });
      
      if (res.ok) {
        setTournamentMembers(res.data || res.result || []);
      } else {
        console.error('Failed to fetch tournament members:', res);
        setTournamentMembers([]);
      }
    } catch (error) {
      console.error('Error fetching tournament members:', error);
      setTournamentMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  // Function to close tournament modal
  const closeTournamentModal = () => {
    setIsTournamentModalOpen(false);
    setSelectedTournament(null);
    setTournamentMembers([]);
    setAddPlayerUsername('');
    setIsFromMyTournaments(false);
  };

  // Function to open update tournament modal
  const openUpdateModal = () => {
    setIsUpdateModalOpen(true);
  };

  // Function to open end tournament modal
  const openEndModal = () => {
    setIsEndModalOpen(true);
  };

  // Function to open tournament members modal
  const openMembersModal = (tournament: any) => {
    setMembersModalTournament({ id: tournament.id, name: tournament.name });
    setIsMembersModalOpen(true);
  };

  const openAddMemberModal = (tournament: any) => {
    setSelectedTournament(tournament);
    setIsAddMemberModalOpen(true);
  };

  // Function to handle successful tournament update
  const handleUpdateSuccess = () => {
    // Refresh tournaments data
    fetchMyTournaments();
    // Close the update modal
    setIsUpdateModalOpen(false);
    // Close the main tournament modal and reopen it to show updated data
    closeTournamentModal();
    if (selectedTournament) {
      openTournamentModal(selectedTournament);
    }
  };

  // Function to handle successful tournament end
  const handleEndSuccess = () => {
    // Refresh tournaments data
    fetchMyTournaments();
    // Close the end modal
    setIsEndModalOpen(false);
    // Close the main tournament modal and reopen it to show updated data
    closeTournamentModal();
    if (selectedTournament) {
      openTournamentModal(selectedTournament);
    }
  };

  // Function to add player to tournament
  const addPlayerToTournament = async () => {
    if (!selectedTournament || !addPlayerUsername.trim()) return;

    setAddingPlayer(true);
    try {
      const token = getAuthToken();
      const res = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.ADD_TOURNAMENT_MEMBER}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          TournamentId: selectedTournament.id,
          Username: addPlayerUsername.trim()
        })
      });

      if (res.ok) {
        setAddPlayerUsername('');
        // Refresh members list
        const membersRes = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_TOURNAMENT_MEMBERS}/${selectedTournament.id}`, { 
          method: 'GET' 
        });
        if (membersRes.ok) {
          setTournamentMembers(membersRes.data || membersRes.result || []);
        }
        // Refresh my tournaments list
        fetchMyTournaments();
        alert(res.message || 'Player added successfully!');
      } else {
        alert(res.error || res.message || 'Failed to add player');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to add player');
    } finally {
      setAddingPlayer(false);
    }
  };


  const handleLogout = () => {
    // Remove the JWT token
    removeAuthToken();
    // Redirect to login page
    router.push('/');
  };




  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-amber-400 text-lg">Loading your realm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 relative overflow-hidden">
      {/* Cosmic Background */}
      <div className="absolute inset-0 hidden sm:block">
        {/* Stars */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
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
        <div className="absolute top-20 left-20 w-4 h-4 bg-cyan-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-32 left-16 w-2 h-2 bg-cyan-200 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-28 left-24 w-3 h-3 bg-cyan-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.8s' }} />
        
        <div className="absolute top-40 right-32 w-3 h-3 bg-blue-300 rounded-full opacity-70 animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-52 right-28 w-2 h-2 bg-blue-200 rounded-full opacity-90 animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-44 right-36 w-4 h-4 bg-blue-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '2.1s' }} />
        
        <div className="absolute bottom-32 left-40 w-2 h-2 bg-purple-300 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.8s' }} />
        <div className="absolute bottom-40 left-36 w-3 h-3 bg-purple-200 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.7s' }} />
        <div className="absolute bottom-36 left-44 w-1 h-1 bg-purple-400 rounded-full opacity-100 animate-pulse" style={{ animationDelay: '1.4s' }} />
        
        {/* Cosmic Dust/Nebula */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-purple-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-radial from-blue-400/8 via-cyan-400/4 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        
        {/* Shooting Stars */}
        <div className="absolute top-20 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '2.5s' }} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-cyan-300 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '4s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-blue-300 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1.5s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-purple-950/90 to-purple-900/90 backdrop-blur-sm border-b border-amber-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-3">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L4 6v8c0 4 3 6 8 8 5-2 8-4 8-8V6l-8-4z"/>
                  <circle cx="12" cy="10" r="2" fill="amber-300"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-amber-400">Board Games Tracker</h1>
                <p className="text-purple-200 text-sm">Chronicle Your Adventures</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-between sm:justify-end">
              <span className="text-purple-200 text-sm sm:text-base">Welcome, {user?.username}</span>
              <button
                onClick={() => router.push('/settings')}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-medium rounded-lg transition-all duration-300 text-sm"
              >
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-300 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Left Content Area */}
          <div className="flex-1">

            {/* Leaderboard - Mobile Optimized */}
            <Leaderboard limit={5} showPagination={false} showSearch={false} className="mb-6 sm:mb-8 border-2 sm:border-4 border-sky-200/70 shadow-lg shadow-sky-200/20" />

            {/* My Tournaments - Mobile Optimized */}
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-amber-400/30 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-amber-400">My Tournaments</h2>
                <button
                  onClick={fetchMyTournaments}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-medium rounded-lg transition-all duration-300 text-sm sm:text-base self-start sm:self-auto"
                >
                  Refresh
                </button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {myTournaments.length > 0 ? myTournaments.map((tournament: any) => (
                  <div
                    key={tournament.id}
                    onClick={() => openTournamentModal(tournament, true)}
                    className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 rounded-lg p-3 sm:p-4 border border-amber-400/20 hover:border-amber-400/40 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-amber-300 font-semibold text-sm sm:text-base">{tournament.name}</h3>
                        <p className="text-purple-300 text-xs sm:text-sm">{tournament.game}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-purple-400">
                          <span>{tournament.memberCount}/{tournament.maxMembers} members</span>
                          <span>{new Date(tournament.tournamentDate).toLocaleDateString()}</span>
                          <span>{tournament.xpReward || 100} XP</span>
                        </div>
                      </div>
                      <div className="flex justify-end sm:text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tournament.phase === 0 ? 'bg-green-500/20 text-green-300' :
                          tournament.phase === 1 ? 'bg-blue-500/20 text-blue-300' :
                          tournament.phase === 2 ? 'bg-purple-500/20 text-purple-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {tournament.phase === 0 ? 'Registration' :
                           tournament.phase === 1 ? 'Started' :
                           tournament.phase === 2 ? 'Finished' : 'Cancelled'}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <div className="text-purple-300">No tournaments created yet</div>
                    <div className="text-purple-400 text-sm mt-2">Create your first tournament below</div>
                  </div>
                )}
              </div>
            </div>

            {/* Create Tournament - Mobile Optimized */}
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl border border-amber-400/30 mb-6 sm:mb-8">
              {/* Expandable Button */}
              <button
                onClick={() => setIsCreateTournamentExpanded(!isCreateTournamentExpanded)}
                className="w-full px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-800/50 to-purple-700/50 hover:from-purple-800/60 hover:to-purple-700/60 text-amber-300 font-medium rounded-t-xl transition-all duration-300 flex items-center justify-between"
              >
                <span className="text-base sm:text-lg font-bold">Create Tournament</span>
                <svg 
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${isCreateTournamentExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Expandable Form */}
              {isCreateTournamentExpanded && (
                <div className="p-4 sm:p-6 border-t border-amber-400/20">
                  <CreateTournamentForm />
                </div>
              )}
            </div>


            {/* Your Player Card - Mobile Optimized */}
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 sm:border-4 border-sky-200/70 shadow-lg shadow-sky-200/20 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-amber-400">Your Profile</h2>
                <button className="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-medium rounded-lg transition-all duration-300 text-sm sm:text-base self-start sm:self-auto">
                  Edit Profile
                </button>
              </div>
              
              <div className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 rounded-xl p-4 sm:p-6 border border-amber-400/20">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-6">
                  {/* Profile Picture - Mobile Friendly */}
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-amber-400">
                      {userProfile?.avatarUrl ? (
                        <img
                          src={userProfile.avatarUrl}
                          alt={userProfile.userName || 'User'}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleAvatarClick(userProfile.avatarUrl!, userProfile.userName || 'User')}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center ${userProfile?.avatarUrl ? 'hidden' : ''}`}>
                        <span className="text-3xl sm:text-2xl font-bold text-purple-900">
                          {userProfile?.userName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Upload Button - Mobile Friendly */}
                    <div className="absolute -bottom-1 -right-1">
                      <label className="w-8 h-8 sm:w-6 sm:h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center border-2 border-purple-900 cursor-pointer hover:from-green-500 hover:to-green-700 active:scale-95 transition-all duration-200 touch-manipulation">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleAvatarUpload(file);
                            }
                          }}
                          className="hidden"
                          disabled={isUploadingAvatar}
                        />
                        {isUploadingAvatar ? (
                          <div className="animate-spin w-4 h-4 sm:w-3 sm:h-3 border border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <svg className="w-4 h-4 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </label>
                    </div>
                  </div>


                  {/* Player Info - Mobile Friendly */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                      <h3 className="text-xl sm:text-2xl font-bold text-amber-300 truncate">
                        {userProfile?.stats?.nickname || userProfile?.userName || user?.username || 'User'}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-300 border border-orange-400/30 self-start">
                        {userPlayer?.guild || 'Elite Guild'}
                      </span>
                    </div>

                    {/* Level and XP Bar - Mobile Friendly */}
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                      <span className="text-lg sm:text-xl font-bold text-amber-400">
                        LVL {userProfile?.stats?.level || userPlayer?.level || 1}
                      </span>
                      <div className="flex-1 bg-purple-900/50 rounded-full h-3 sm:h-4 overflow-hidden border-2 border-amber-400/60">
                        {(userProfile?.stats || userPlayer) ? (() => {
                          // Derive from actual XP to avoid mismatch with level calc
                          const xp = Math.max(0, userProfile?.stats?.xp || userPlayer?.xp || 0);
                          const levelBase = Math.floor(xp / 1000) * 1000;
                          const xpInCurrentLevel = xp - levelBase;
                          const xpPercentage = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / 1000) * 100)));
                          return (
                            <div 
                              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                              style={{ width: `${xpPercentage}%` }}
                            ></div>
                          );
                        })() : (
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                            style={{ width: '65%' }}
                          ></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-amber-300">
                        {(userProfile?.stats || userPlayer) ? (() => {
                          const xp = Math.max(0, userProfile?.stats?.xp || userPlayer?.xp || 0);
                          const levelBase = Math.floor(xp / 1000) * 1000;
                          const xpInCurrentLevel = xp - levelBase;
                          const xpPercentage = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / 1000) * 100)));
                          return `${xpPercentage}%`;
                        })() : '65%'}
                      </span>
                    </div>

                    {/* Stats Row - Mobile Friendly */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-amber-400">{userPlayer?.matchesPlayed || 0}</div>
                        <div className="text-xs text-purple-300">Games Played</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-400">{userPlayer?.wins || 0}</div>
                        <div className="text-xs text-purple-300">Games Won</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-blue-400">{userPlayer ? Math.round(userPlayer.winRate * 100) : 0}%</div>
                        <div className="text-xs text-purple-300">Win Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="flex flex-col space-y-2">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-amber-400">+{userPlayer?.totalScore || 0}</div>
                      <div className="text-xs text-purple-300">Total Points</div>
                    </div>
                    <div className="flex space-x-1 sm:space-x-2 justify-center">
                      {userPlayer?.mvps > 0 && (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-500 rounded-full flex items-center justify-center" title={`${userPlayer.mvps} MVP${userPlayer.mvps > 1 ? 's' : ''}`}>
                          <span className="text-yellow-900 text-xs sm:text-sm">⭐</span>
                        </div>
                      )}
                      {userPlayer?.tournamentsWon > 0 && (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-600 rounded-full flex items-center justify-center" title={`${userPlayer.tournamentsWon} Tournament Win${userPlayer.tournamentsWon > 1 ? 's' : ''}`}>
                          <span className="text-yellow-100 text-xs sm:text-sm">👑</span>
                        </div>
                      )}
                      {userPlayer?.wins > 0 && (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-800 rounded-full flex items-center justify-center" title={`${userPlayer.wins} Win${userPlayer.wins > 1 ? 's' : ''}`}>
                          <span className="text-white text-xs sm:text-sm">🏆</span>
                        </div>
                      )}
                      {(!userPlayer || (userPlayer.mvps === 0 && userPlayer.tournamentsWon === 0 && userPlayer.wins === 0)) && (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-600 rounded-full flex items-center justify-center" title="No achievements yet">
                          <span className="text-gray-300 text-xs sm:text-sm">🎯</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <button className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border-4 border-sky-200/70 hover:border-sky-200/90 shadow-lg shadow-sky-200/20 hover:shadow-sky-200/30 transition-all duration-300 text-left">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-amber-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-amber-400 font-medium">Add New Game</h3>
                    <p className="text-purple-300 text-sm">Record a new game session</p>
                  </div>
                </div>
              </button>

              <button className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border-4 border-sky-200/70 hover:border-sky-200/90 shadow-lg shadow-sky-200/20 hover:shadow-sky-200/30 transition-all duration-300 text-left">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-green-400 font-medium">View Statistics</h3>
                    <p className="text-purple-300 text-sm">Detailed game analytics</p>
                  </div>
                </div>
              </button>

              <button className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border-4 border-sky-200/70 hover:border-sky-200/90 shadow-lg shadow-sky-200/20 hover:shadow-sky-200/30 transition-all duration-300 text-left">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-blue-400 font-medium">Game Library</h3>
                    <p className="text-purple-300 text-sm">Manage your collection</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Right Sidebar - Tournaments List */}
          <div className="w-full lg:w-96 flex-shrink-0 relative">
            {/* Stardust around Board Games */}
            <div className="absolute -top-4 -left-4 w-6 h-6 bg-cyan-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.8s' }} />
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-300 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-8 -left-6 w-2 h-2 bg-purple-300 rounded-full opacity-70 animate-pulse" style={{ animationDelay: '2.2s' }} />
            <div className="absolute top-16 -right-4 w-4 h-4 bg-cyan-200 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.3s' }} />
            <div className="absolute top-24 -left-2 w-1 h-1 bg-white rounded-full opacity-90 animate-pulse" style={{ animationDelay: '1.8s' }} />
            <div className="absolute top-32 -right-6 w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '2.7s' }} />
            
            {/* Floating stardust particles */}
            <div className="absolute top-12 left-2 w-1 h-1 bg-cyan-400 rounded-full opacity-80 animate-ping" style={{ animationDuration: '3s', animationDelay: '1.2s' }} />
            <div className="absolute top-20 right-1 w-1 h-1 bg-purple-400 rounded-full opacity-70 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '2.8s' }} />
            <div className="absolute top-28 left-1 w-1 h-1 bg-blue-300 rounded-full opacity-90 animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
            
            {/* Cosmic dust near board games */}
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-gradient-radial from-cyan-500/5 via-blue-500/3 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
            <div className="absolute -top-4 -right-8 w-24 h-24 bg-gradient-radial from-purple-500/6 via-cyan-500/2 to-transparent rounded-full blur-xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '2.5s' }} />
            
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-4 border-sky-200/70 shadow-lg shadow-sky-200/20 lg:sticky lg:top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-amber-400">Tournaments</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchTournaments}
                    className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 rounded-lg text-sm"
                  >
                    Refresh
                  </button>
                  <button 
                    onClick={() => console.log('Add tournament clicked')}
                    className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 rounded-lg transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search tournaments..."
                    className="w-full pl-10 pr-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Tournaments List */}
              <div className="space-y-4 max-h-[28rem] overflow-y-auto custom-scrollbar overflow-x-hidden">
                {tournamentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mr-2"></div>
                    <p className="text-amber-400 text-lg">Loading tournaments...</p>
                  </div>
                ) : tournaments.length > 0 ? tournaments.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => openTournamentModal(t, false)}
                    className="group bg-gradient-to-r from-purple-900/50 to-purple-800/50 hover:from-purple-800/60 hover:to-purple-700/60 rounded-lg p-5 border-4 border-sky-200/40 hover:border-sky-200/70 shadow-md shadow-sky-200/10 hover:shadow-sky-200/20 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Game Icon */}
                      <div className="text-3xl bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg p-2 flex-shrink-0">
🏟️
                      </div>
                      
                      {/* Game Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-amber-300 font-semibold text-sm truncate group-hover:text-amber-200 transition-colors">
                          {t.name}
                        </h3>
                        <p className="text-purple-300 text-xs mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to view tournament details
                        </p>
                        <p className="text-purple-300 text-xs mb-1">{t.game}</p>
                        <p className="text-purple-400 text-xs">
                          GM: {t.gameMasterUsername || 'Unknown'}
                        </p>
                        
                        {/* Game Details - Flexible layout */}
                        <div className="space-y-2">
                          {/* Details with flex-wrap */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-purple-400">
                            <span className="flex items-center whitespace-nowrap">
                              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                              {t.memberCount}/{t.maxMembers} members
                          </span>
                            <span className="flex items-center whitespace-nowrap">
                              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                              {new Date(t.tournamentDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center whitespace-nowrap">
                              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              {t.xpReward || 100} XP
                            </span>
                            <span className="flex items-center whitespace-nowrap">
                              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {t.mvpXpReward || 50} MVP XP
                          </span>
                          </div>
                        </div>
                        
                        {/* Status */}
                        <div className="flex items-center justify-between mt-2 min-w-0">
                          <div className="flex items-center space-x-1 min-w-0 flex-1">
                            <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span className="text-amber-400 text-xs font-medium truncate">{t.name}</span>
                          </div>
                          
                          <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                            t.memberCount < t.maxMembers 
                              ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                              : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                          }`}>
                            {t.memberCount < t.maxMembers ? 'Open' : 'Full'}
                          </span>
                        </div>

                        {/* Members button */}
                        <div className="mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openMembersModal(t);
                            }}
                            className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 rounded-lg text-xs"
                          >
                            View Members
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <div className="text-purple-300 text-lg">No tournaments available</div>
                    <div className="text-purple-400 text-sm mt-2">Tournaments will appear here as they are created</div>
                  </div>
                )}
              </div>

              {/* View All Button */}
              <div className="mt-6 pt-4 border-t border-purple-700/30">
                <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105">
                  View All Tournaments
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Management Modal */}
      {isTournamentModalOpen && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-950/95 to-purple-900/95 backdrop-blur-sm rounded-xl border-4 border-sky-200/70 shadow-2xl shadow-sky-200/20 w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-sky-200/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-amber-400">{selectedTournament.name}</h2>
                  <p className="text-purple-300">{selectedTournament.game}</p>
                </div>
                <button
                  onClick={closeTournamentModal}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Tournament Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-amber-400">Tournament Stats</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-purple-800/40 rounded-lg p-3 border border-sky-200/20 min-w-0">
                      <div className="text-xl font-bold text-amber-400 truncate">{selectedTournament.memberCount}</div>
                      <div className="text-xs text-purple-300 truncate">Current Members</div>
                    </div>
                    <div className="bg-purple-800/40 rounded-lg p-3 border border-sky-200/20 min-w-0">
                      <div className="text-xl font-bold text-amber-400 truncate">{selectedTournament.maxMembers}</div>
                      <div className="text-xs text-purple-300 truncate">Max Members</div>
                    </div>
                    <div className="bg-purple-800/40 rounded-lg p-3 border border-sky-200/20 min-w-0">
                      <div className="text-xl font-bold text-amber-400 truncate">{selectedTournament.xpReward || 100}</div>
                      <div className="text-xs text-purple-300 truncate">XP Reward</div>
                    </div>
                    <div className="bg-purple-800/40 rounded-lg p-3 border border-sky-200/20 min-w-0">
                      <div className="text-xl font-bold text-amber-400 truncate">{selectedTournament.mvpXpReward || 50}</div>
                      <div className="text-xs text-purple-300 truncate">MVP XP Reward</div>
                    </div>
                  </div>

                  <div className="bg-purple-800/40 rounded-lg p-4 border border-sky-200/20">
                    <div className="text-sm text-purple-300 mb-2">Tournament Date</div>
                    <div className="text-amber-400 font-semibold">
                      {new Date(selectedTournament.tournamentDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="bg-purple-800/40 rounded-lg p-4 border border-sky-200/20">
                    <div className="text-sm text-purple-300 mb-2">Status</div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedTournament.phase === 0 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                        : selectedTournament.phase === 1
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                        : selectedTournament.phase === 2
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                        : selectedTournament.phase === 3
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                        : 'bg-red-500/20 text-red-300 border border-red-400/30'
                    }`}>
                      {getPhaseDisplayName(selectedTournament.phase)}
                    </span>
                  </div>

                  <div className="bg-purple-800/40 rounded-lg p-4 border border-sky-200/20">
                    <div className="text-sm text-purple-300 mb-2">Game Master</div>
                    <div className="text-amber-400 font-semibold">
                      {selectedTournament.gameMasterUsername || 'Unknown GM'}
                    </div>
                  </div>
                </div>

                {/* Tournament Members */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-amber-400">Tournament Members</h3>
                    {/* Only show Add Player functionality for tournaments from My Tournaments section and not finished */}
                    {selectedTournament && isFromMyTournaments && selectedTournament.phase !== 2 && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openAddMemberModal(selectedTournament)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 rounded-lg text-sm font-medium transition-all duration-300"
                        >
                          Add Member
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-purple-800/40 rounded-lg border border-sky-200/20 max-h-80 overflow-y-auto">
                    {membersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mr-2"></div>
                        <p className="text-amber-400">Loading members...</p>
                      </div>
                    ) : tournamentMembers.length > 0 ? (
                      <div className="space-y-2 p-4">
                        {tournamentMembers.map((member: any, index: number) => (
                          <div key={member.id} className="flex items-center justify-between bg-purple-700/30 rounded-lg p-3 min-w-0">
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-purple-900">
                                  {member.nickname?.charAt(0).toUpperCase() || 'P'}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-amber-300 font-medium text-sm truncate">{member.nickname}</div>
                                <div className="text-purple-400 text-xs truncate">
                                  Joined: {new Date(member.joinedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              {member.placement && (
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs whitespace-nowrap">
                                  #{member.placement}
                                </span>
                              )}
                              {member.score && (
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs whitespace-nowrap">
                                  {member.score} pts
                                </span>
                              )}
                              <button
                                onClick={() => promptRemoveMember(member)}
                                disabled={removingMemberId === member.id}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove member from tournament"
                              >
                                {removingMemberId === member.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-purple-300 text-lg">No members yet</div>
                        <div className="text-purple-400 text-sm mt-2">Players will appear here when they join</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tournament Finished Banner */}
              {selectedTournament.phase === 2 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-800/50 to-purple-700/50 border border-purple-400/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-amber-300 font-semibold">Tournament Finished</h3>
                      <p className="text-purple-300 text-sm">This tournament has been completed. XP rewards have been distributed and no further changes can be made.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-sky-200/20">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button 
                      disabled={selectedTournament.phase === 2}
                      className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-all duration-300"
                    >
                      {selectedTournament.phase === 2 ? 'Tournament Finished' : 'Start Tournament'}
                    </button>
                    <button 
                      onClick={openUpdateModal}
                      disabled={selectedTournament.phase === 2}
                      className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-all duration-300"
                    >
                      {selectedTournament.phase === 2 ? 'Tournament Finished' : 'Edit Tournament'}
                    </button>
                    <button 
                      onClick={openEndModal}
                      disabled={selectedTournament.phase === 2}
                      className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-purple-900 rounded-lg font-medium text-sm transition-all duration-300"
                    >
                      {selectedTournament.phase === 2 ? 'Tournament Finished' : 'Finish Tournament'}
                    </button>
                  </div>
                  <button
                    onClick={closeTournamentModal}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Tournament Modal */}
      {selectedTournament && (
        <UpdateTournamentModal
          tournament={selectedTournament}
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* End Tournament Modal */}
      {selectedTournament && (
        <EndTournamentModal
          tournament={selectedTournament}
          tournamentMembers={tournamentMembers}
          isOpen={isEndModalOpen}
          onClose={() => setIsEndModalOpen(false)}
          onSuccess={handleEndSuccess}
        />
      )}

      {/* Tournament Members Modal */}
      {membersModalTournament && (
        <TournamentMembersModal
          tournamentId={membersModalTournament.id}
          tournamentName={membersModalTournament.name}
          isOpen={isMembersModalOpen}
          onClose={() => {
            setIsMembersModalOpen(false);
            setMembersModalTournament(null);
          }}
          onMemberRemoved={() => {
            // Refresh tournaments list when member is removed
            fetchMyTournaments();
            fetchTournaments();
          }}
        />
      )}

      {/* Add Tournament Member Modal */}
      {selectedTournament && (
        <AddTournamentMemberModal
          tournamentId={selectedTournament.id}
          tournamentName={selectedTournament.name}
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          onAdded={async () => {
            // refresh members list in modal
            try {
              const res = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOARDGAME.GET_TOURNAMENT_MEMBERS}/${selectedTournament.id}`, { method: 'GET' });
              if (res.ok) setTournamentMembers(res.data || res.result || []);
              fetchMyTournaments();
            } catch {}
          }}
        />
      )}

      {/* Confirm remove member */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Remove Member"
        description={pendingRemoval ? `Are you sure you want to remove ${pendingRemoval.nickname} from this tournament?` : ''}
        confirmText="Remove"
        cancelText="Cancel"
        danger
        loading={removingMemberId != null}
        onConfirm={removeMemberFromTournament}
        onCancel={() => { setConfirmOpen(false); setPendingRemoval(null); }}
      />

      {/* Info modal for creation and errors */}
      <InfoModal
        isOpen={infoOpen}
        title={infoSuccess ? 'Tournament Created' : 'Action Failed'}
        message={infoMessage}
        success={infoSuccess}
        onClose={() => setInfoOpen(false)}
      />

      {/* Avatar Modal */}
      {isAvatarModalOpen && selectedAvatar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-2xl p-6 max-w-md w-full border border-amber-400/30">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-amber-300">
                {selectedAvatar.nickname}'s Avatar
              </h3>
              <button
                onClick={handleAvatarModalClose}
                className="text-purple-300 hover:text-amber-400 transition-colors p-2 hover:bg-purple-800/50 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Avatar Image */}
            <div className="flex justify-center mb-4">
              <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl">
                <img
                  src={selectedAvatar.url}
                  alt={`${selectedAvatar.nickname}'s avatar`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center hidden">
                  <span className="text-6xl font-bold text-purple-900">
                    {selectedAvatar.nickname.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="text-center">
              <p className="text-purple-200 text-sm">
                Click outside or press ESC to close
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 