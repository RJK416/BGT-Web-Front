'use client';

import { useState, useEffect, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken, getUserFromToken, isAuthenticated } from '@/utils/auth';
import { API_CONFIG, apiRequest } from '@/config/api';
import Leaderboard from '@/components/Leaderboard';
import { guildService } from '@/services/guildService';
import type { Guild } from '@/types/guild';
import UpdateTournamentModal from '@/components/UpdateTournamentModal';
import EndTournamentModal from '@/components/EndTournamentModal';
import TournamentMembersModal from '@/components/TournamentMembersModal';
import AddTournamentMemberModal from '@/components/AddTournamentMemberModal';
import { getPhaseDisplayName } from '@/types/tournament';
import ConfirmModal from '@/components/ConfirmModal';
import InfoModal from '@/components/InfoModal';
import NotificationBar from '@/components/NotificationBar';
import { tavernPalette } from '@/styles/tavernTheme';

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
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildsLoading, setGuildsLoading] = useState(true);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPlayer, setUserPlayer] = useState<any>(null);
  const isGM = (() => {
    // Try both 'role' and 'Role' properties since the API returns 'Role' but JS might convert it
    const r = userPlayer?.role || userPlayer?.Role;
    if (r == null) return false;
    if (typeof r === 'string') return r.toUpperCase() === 'GM';
    return r === 1; // numeric enum fallback
  })();
  const [userPlayerLoading, setUserPlayerLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isCreateTournamentExpanded, setIsCreateTournamentExpanded] = useState(false);
  const [isAppointGMExpanded, setIsAppointGMExpanded] = useState(false);
  const [appointGMUsername, setAppointGMUsername] = useState('');
  const [isAppointingGM, setIsAppointingGM] = useState(false);

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

  const pageBackgroundStyle: CSSProperties = {
    minHeight: '100vh',
    backgroundColor: tavernPalette.background,
    backgroundImage: `radial-gradient(circle at top, rgba(15, 35, 29, 0.65), transparent 55%), radial-gradient(circle at bottom, rgba(12, 24, 20, 0.6), transparent 60%)`,
    color: tavernPalette.parchment
  };

  const headerStyle: CSSProperties = {
    background: 'linear-gradient(135deg, rgba(21, 49, 39, 0.95), rgba(13, 32, 26, 0.95))',
    borderBottom: `1px solid ${tavernPalette.border}`,
    boxShadow: `0 10px 35px ${tavernPalette.shadow}`
  };

  const tournamentPanelStyle: CSSProperties = {
    backgroundImage: tavernPalette.panelGradient,
    border: `1px solid ${tavernPalette.border}`,
    boxShadow: `0 20px 60px ${tavernPalette.shadow}`,
    color: tavernPalette.parchment
  };

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

  const fetchGuilds = async () => {
    try {
      setGuildsLoading(true);
      try { console.log('Fetching guilds...'); } catch {}
      const res = await guildService.getAllGuilds(1, 5);
      try { console.log('Guilds API response:', res); } catch {}
      if ((res as any)?.status === 200) {
        const dataBlock = (res as any)?.data || {};
        const items = (dataBlock as any).guilds ?? (dataBlock as any).items;
        try { console.log('Parsed guilds:', items); } catch {}
        setGuilds(Array.isArray(items) ? items : []);
      } else {
        setGuilds([]);
      }
    } catch (error) {
      console.error('Error fetching guilds:', error);
      setGuilds([]);
    } finally {
      setGuildsLoading(false);
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
        // Don't override userPlayer here - it should come from fetchUserPlayer() with role data
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

        await Promise.all([fetchUserPlayer(), fetchUserProfile(), fetchTournaments(), fetchGuilds()]);
      } finally {
        setIsLoading(false);
      }
    };


    checkAuth();
  }, [router]); 

  // Function to fetch my tournaments
  const fetchMyTournaments = async () => {
    if (!userPlayer) return;
    
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

  const handleAppointGM = async () => {
    if (!appointGMUsername.trim()) {
      setInfoSuccess(false);
      setInfoMessage('Please enter a username');
      setInfoOpen(true);
      return;
    }

    try {
      setIsAppointingGM(true);
      const response = await guildService.appointGMByUsername(appointGMUsername.trim());
      
      if (response.isSuccess && response.status === 200) {
        setInfoSuccess(true);
        setInfoMessage(response.message || `Successfully appointed '${appointGMUsername}' as GM!`);
        setInfoOpen(true);
        setAppointGMUsername(''); // Clear the input
        setIsAppointGMExpanded(false); // Collapse the section
      } else {
        setInfoSuccess(false);
        setInfoMessage((response as any).error || response.message || 'Failed to appoint GM');
        setInfoOpen(true);
      }
    } catch (error: any) {
      setInfoSuccess(false);
      setInfoMessage(error.message || 'Failed to appoint GM');
      setInfoOpen(true);
    } finally {
      setIsAppointingGM(false);
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
      // refresh list after a short delay to ensure backend has processed the creation
      setTimeout(() => {
        if (typeof fetchMyTournaments === 'function') fetchMyTournaments();
      }, 500);
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
      {message && <div className="text-sm text-[#F4EBD0]">{message}</div>}
      <div>
        <label className="block text-[#F4EBD0] text-sm mb-1 font-medium">Name</label>
        <input 
          value={name} 
          onChange={e=>setName(e.target.value)} 
          className="w-full pl-3 pr-3 py-2 bg-[#2A1D12]/90 border border-[#9C6B3E]/50 rounded-lg text-[#F4EBD0] placeholder-[#B6AA96] focus:outline-none focus:ring-2 focus:ring-[#E7B45D]/60 focus:border-[#E7B45D]/40 transition-all" 
          required 
        />
      </div>
      <div>
        <label className="block text-[#F4EBD0] text-sm mb-1 font-medium">Game</label>
        <input 
          value={game} 
          onChange={e=>setGame(e.target.value)} 
          className="w-full pl-3 pr-3 py-2 bg-[#2A1D12]/90 border border-[#9C6B3E]/50 rounded-lg text-[#F4EBD0] placeholder-[#B6AA96] focus:outline-none focus:ring-2 focus:ring-[#E7B45D]/60 focus:border-[#E7B45D]/40 transition-all" 
          required 
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-[#F4EBD0] text-sm mb-1 font-medium">Date (DD.MM.YYYY)</label>
          <input
            type="text"
            placeholder="dd.mm.yyyy"
            value={tournamentDate}
            onChange={e=>setTournamentDate(e.target.value)}
            className="w-full pl-3 pr-3 py-2 bg-[#2A1D12]/90 border border-[#9C6B3E]/50 rounded-lg text-[#F4EBD0] placeholder-[#B6AA96] focus:outline-none focus:ring-2 focus:ring-[#E7B45D]/60 focus:border-[#E7B45D]/40 transition-all"
            pattern="^(0?[1-9]|[12][0-9]|3[01])\.(0?[1-9]|1[0-2])\.(19|20)\d{2}$"
            title="Enter date as DD.MM.YYYY"
            required
          />
        </div>
        <div>
          <label className="block text-[#F4EBD0] text-sm mb-1 font-medium">Max Members</label>
          <input 
            type="number" 
            min={1} 
            value={maxMembers} 
            onChange={e=>setMaxMembers(parseInt(e.target.value||'0'))} 
            className="no-spinner w-full pl-3 pr-3 py-2 bg-[#2A1D12]/90 border border-[#9C6B3E]/50 rounded-lg text-[#F4EBD0] placeholder-[#B6AA96] focus:outline-none focus:ring-2 focus:ring-[#E7B45D]/60 focus:border-[#E7B45D]/40 transition-all" 
            required 
          />
        </div>
        <div>
          <label className="block text-[#F4EBD0] text-sm mb-1 font-medium">Initial Members</label>
          <input 
            type="number" 
            min={0} 
            value={memberCount} 
            onChange={e=>setMemberCount(parseInt(e.target.value||'0'))} 
            className="no-spinner w-full pl-3 pr-3 py-2 bg-[#2A1D12]/90 border border-[#9C6B3E]/50 rounded-lg text-[#F4EBD0] placeholder-[#B6AA96] focus:outline-none focus:ring-2 focus:ring-[#E7B45D]/60 focus:border-[#E7B45D]/40 transition-all" 
            required 
          />
        </div>
        <div>
          <label className="block text-[#F4EBD0] text-sm mb-1 font-medium">XP Reward</label>
          <input 
            type="number" 
            min={0} 
            value={xpReward} 
            onChange={e=>setXpReward(parseInt(e.target.value||'0'))} 
            className="no-spinner w-full pl-3 pr-3 py-2 bg-[#2A1D12]/90 border border-[#9C6B3E]/50 rounded-lg text-[#F4EBD0] placeholder-[#B6AA96] focus:outline-none focus:ring-2 focus:ring-[#E7B45D]/60 focus:border-[#E7B45D]/40 transition-all" 
            required 
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#F4EBD0] text-sm mb-1 font-medium">MVP XP Reward</label>
          <input 
            type="number" 
            min={0} 
            value={mvpXpReward} 
            onChange={e=>setMvpXpReward(parseInt(e.target.value||'0'))} 
            className="no-spinner w-full pl-3 pr-3 py-2 bg-[#2A1D12]/90 border border-[#9C6B3E]/50 rounded-lg text-[#F4EBD0] placeholder-[#B6AA96] focus:outline-none focus:ring-2 focus:ring-[#E7B45D]/60 focus:border-[#E7B45D]/40 transition-all" 
            required 
          />
        </div>
      </div>
      <button 
        disabled={creating} 
        style={{
          padding: '10px 16px',
          background: creating 
            ? 'linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%)'
            : 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
          border: '1px solid rgba(156, 107, 62, 0.7)',
          borderRadius: '8px',
          color: creating ? '#999' : '#2A1D12',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s',
          cursor: creating ? 'not-allowed' : 'pointer'
        }}
        className="hover:opacity-90"
      >
        {creating ? 'Creating...' : 'Create Tournament'}
      </button>
    </form>
  );
}

  // Fetch my tournaments when userPlayer is loaded
  useEffect(() => {
    fetchMyTournaments();
  }, [userPlayer]);

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
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-orange-400 text-lg">Loading your realm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden" style={pageBackgroundStyle}>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-sm border-b border-orange-500/40" style={{background: 'linear-gradient(to right, rgba(26, 95, 82, 0.95), rgba(15, 66, 52, 0.95))'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-3 relative">
            {/* Left side - Logo and Title */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img 
                src="/4447.png" 
                alt="Castle Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-orange-400">Guild</h1>
                <p className="text-emerald-200 text-sm">Chronicle Your Adventures</p>
              </div>
            </div>
            
            {/* Center - Dragon Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img 
                src="/6669.png" 
                alt="Dragon Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            
            {/* Right side - User controls */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-between sm:justify-end">
              <span className="text-emerald-200 text-sm sm:text-base">Welcome, {(user as any)?.username || (user as any)?.name || (user as any)?.unique_name || 'User'}</span>
              
              {/* Notification Bar */}
              <NotificationBar className="flex-shrink-0" />
              
              <button
                onClick={() => router.push('/settings')}
                style={{
                  padding: '8px 16px',
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
                Settings
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(180deg, rgba(128, 44, 44, 0.9) 0%, rgba(90, 25, 25, 0.95) 100%)',
                  border: '1px solid rgba(156, 107, 62, 0.7)',
                  borderRadius: '8px',
                  color: '#F4EBD0',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 4px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                className="hover:opacity-90"
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
            <Leaderboard limit={5} showPagination={false} showSearch={false} className="mb-6 sm:mb-8" />

            {/* Guild Scoreboard */}
            <div className="medieval-panel p-4 sm:p-6 mb-6 sm:mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#F4EBD0] medieval-heading">Top Guilds</h2>
                <button
                  onClick={fetchGuilds}
                  style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                    border: '1px solid rgba(156, 107, 62, 0.7)',
                    borderRadius: '8px',
                    color: '#2A1D12',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s'
                  }}
                  className="hover:opacity-90"
                >
                  Refresh
                </button>
              </div>

              {guildsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E7B45D] mr-2" />
                  <span className="text-[#F4EBD0]">Loading guilds...</span>
                </div>
              ) : guilds.length > 0 ? (
                <div className="space-y-3">
                  {guilds.map((g, idx) => (
                    <div 
                      key={g.id} 
                      style={{
                        background: 'linear-gradient(180deg, rgba(20, 12, 8, 0.98) 0%, rgba(15, 9, 6, 0.99) 100%)',
                        border: '1px solid rgba(60, 35, 20, 0.8)',
                        borderRadius: '16px',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 14px 28px rgba(0, 0, 0, 0.8)',
                        padding: '18px 22px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      className="flex items-center justify-between hover:bg-[#2A1D12]/90 hover:border-[#E7B45D]/60"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div 
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '9999px',
                            background: 'radial-gradient(circle at 30% 30%, #6c4729 0%, #2f1b10 70%)',
                            border: '1px solid rgba(120, 80, 46, 0.85)',
                            boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.12), 0 6px 10px rgba(0, 0, 0, 0.45)',
                            color: '#f4ebd0',
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                          className="font-medieval"
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[#F4EBD0] font-semibold text-base truncate" style={{ fontFamily: 'Arial, Helvetica, sans-serif', textTransform: 'none' }}>
                            {g.name}
                          </div>
                          <div className="text-[#B6AA96] text-xs truncate mt-1">Leader: {g.creatorName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 text-xs text-[#B6AA96]">
                        <span className="whitespace-nowrap font-semibold">Lv {g.level ?? 1}</span>
                        <span className="whitespace-nowrap">{g.memberCount}/{(g as any).maxMember || (g as any).maxMembers || 0} members</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-[#F4EBD0]">No guilds found</div>
              )}

              <div className="mt-4">
                <button
                  onClick={() => router.push('/guild')}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    background: 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                    border: '1px solid rgba(156, 107, 62, 0.7)',
                    borderRadius: '8px',
                    color: '#2A1D12',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s'
                  }}
                  className="hover:opacity-90"
                >
                  View All Guilds
                </button>
              </div>
            </div>


            {/* My Tournaments - Mobile Optimized - Only show for GMs */}
            {isGM && (
              <div className="medieval-panel p-4 sm:p-6 mb-6 sm:mb-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-[#F4EBD0] medieval-heading">My Tournaments</h2>
                  <button
                    onClick={async () => {
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
                        console.error('Error refreshing tournaments:', error);
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                      border: '1px solid rgba(156, 107, 62, 0.7)',
                      borderRadius: '8px',
                      color: '#2A1D12',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s'
                    }}
                    className="hover:opacity-90 self-start sm:self-auto"
                  >
                    Refresh
                  </button>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                  {myTournaments.length > 0 ? myTournaments.map((tournament: any) => (
                    <div
                      key={tournament.id}
                      onClick={() => openTournamentModal(tournament, true)}
                      style={{
                        background: 'linear-gradient(180deg, rgba(20, 12, 8, 0.98) 0%, rgba(15, 9, 6, 0.99) 100%)',
                        border: '1px solid rgba(60, 35, 20, 0.8)',
                        borderRadius: '16px',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 14px 28px rgba(0, 0, 0, 0.8)',
                        padding: '18px 22px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      className="hover:bg-[#2A1D12]/90 hover:border-[#E7B45D]/60"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="text-[#F4EBD0] font-semibold text-base" style={{ fontFamily: 'Arial, Helvetica, sans-serif', textTransform: 'none' }}>
                            {tournament.name}
                          </h3>
                          <p className="text-[#B6AA96] text-xs sm:text-sm mt-1">{tournament.game}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-[#B6AA96]">
                            <span>{tournament.memberCount}/{tournament.maxMembers} members</span>
                            <span>{new Date(tournament.tournamentDate).toLocaleDateString('de-DE')}</span>
                            <span>{tournament.xpReward || 100} XP</span>
                          </div>
                        </div>
                        <div className="flex justify-end sm:text-right">
                          <span 
                            style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              border: tournament.phase === 0 ? '1px solid rgba(60, 122, 87, 0.8)' :
                                      tournament.phase === 1 ? '1px solid rgba(78, 49, 28, 0.7)' :
                                      tournament.phase === 2 ? '1px solid rgba(60, 122, 87, 0.8)' :
                                      '1px solid rgba(128, 44, 44, 0.7)',
                              background: tournament.phase === 0 ? 'rgba(60, 122, 87, 0.18)' :
                                         tournament.phase === 1 ? 'rgba(60, 122, 87, 0.08)' :
                                         tournament.phase === 2 ? 'rgba(60, 122, 87, 0.18)' :
                                         'rgba(128, 44, 44, 0.15)',
                              color: tournament.phase === 0 ? '#d7ead3' :
                                     tournament.phase === 1 ? '#ccba93' :
                                     tournament.phase === 2 ? '#d7ead3' :
                                     '#e8a8a8'
                            }}
                          >
                            {tournament.phase === 0 ? 'Registration' :
                             tournament.phase === 1 ? 'Started' :
                             tournament.phase === 2 ? 'Finished' : 'Cancelled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <div className="text-[#F4EBD0]">No tournaments created yet</div>
                      <div className="text-[#B6AA96] text-sm mt-2">Create your first tournament below</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Create Tournament - Mobile Optimized - Only show for GMs */}
            {isGM && (
              <div className="medieval-panel mb-6 sm:mb-8"
              >
                {/* Expandable Button */}
                <button
                  onClick={() => setIsCreateTournamentExpanded(!isCreateTournamentExpanded)}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: 'linear-gradient(180deg, rgba(20, 12, 8, 0.95) 0%, rgba(15, 9, 6, 0.98) 100%)',
                    border: 'none',
                    borderBottom: '1px solid rgba(60, 35, 20, 0.6)',
                    borderRadius: '12px 12px 0 0',
                    color: '#F4EBD0',
                    fontSize: '1rem',
                    fontWeight: 600,
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  className="hover:bg-[#2A1D12]/90"
                >
                  <span className="text-base sm:text-lg font-bold medieval-heading">Create Tournament</span>
                  <svg 
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${isCreateTournamentExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="#F4EBD0" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Expandable Form */}
                {isCreateTournamentExpanded && (
                  <div className="p-4 sm:p-6" style={{ borderTop: '1px solid rgba(60, 35, 20, 0.6)' }}>
                    <CreateTournamentForm />
                  </div>
                )}
              </div>
            )}

            {/* Appoint GM - Mobile Optimized - Only show for GMs */}
            {isGM && (
              <div className="medieval-panel mb-6 sm:mb-8"
              >
                {/* Expandable Button */}
                <button
                  onClick={() => setIsAppointGMExpanded(!isAppointGMExpanded)}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: 'linear-gradient(180deg, rgba(20, 12, 8, 0.95) 0%, rgba(15, 9, 6, 0.98) 100%)',
                    border: 'none',
                    borderBottom: '1px solid rgba(60, 35, 20, 0.6)',
                    borderRadius: '12px 12px 0 0',
                    color: '#F4EBD0',
                    fontSize: '1rem',
                    fontWeight: 600,
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  className="hover:bg-[#2A1D12]/90"
                >
                  <span className="text-base sm:text-lg font-bold medieval-heading">Appoint GM</span>
                  <svg 
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${isAppointGMExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="#F4EBD0" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Expandable Content */}
                {isAppointGMExpanded && (
                  <div className="p-4 sm:p-6" style={{ borderTop: '1px solid rgba(60, 35, 20, 0.6)' }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[#F4EBD0] text-sm font-medium mb-2">
                          Username
                        </label>
                        <input
                          type="text"
                          value={appointGMUsername}
                          onChange={(e) => setAppointGMUsername(e.target.value)}
                          placeholder="Enter username to appoint as GM"
                          className="w-full px-4 py-3 bg-[#2A1D12]/90 border border-[#9C6B3E]/50 rounded-lg text-[#F4EBD0] placeholder-[#B6AA96] focus:outline-none focus:ring-2 focus:ring-[#E7B45D]/60 focus:border-[#E7B45D]/40 transition-all duration-300"
                        />
                      </div>
                      
                      <button
                        onClick={handleAppointGM}
                        disabled={!appointGMUsername.trim() || isAppointingGM}
                        style={{
                          width: '100%',
                          padding: '12px 0',
                          background: !appointGMUsername.trim() || isAppointingGM 
                            ? 'linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%)'
                            : 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                          border: '1px solid rgba(156, 107, 62, 0.7)',
                          borderRadius: '8px',
                          color: !appointGMUsername.trim() || isAppointingGM ? '#999' : '#2A1D12',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                          transition: 'all 0.3s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: (!appointGMUsername.trim() || isAppointingGM) ? 'not-allowed' : 'pointer'
                        }}
                        className="hover:opacity-90"
                      >
                        {isAppointingGM ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Appointing...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            Appoint GM
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Your Player Card - Mobile Optimized */}
            <div className="medieval-panel p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#F4EBD0] medieval-heading" style={{ textTransform: 'none' }}>Your Profile</h2>
                <button 
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                    border: '1px solid rgba(156, 107, 62, 0.7)',
                    borderRadius: '8px',
                    color: '#2A1D12',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s'
                  }}
                  className="hover:opacity-90 self-start sm:self-auto"
                >
                  Edit Profile
                </button>
              </div>
              
              <div style={{
                background: 'linear-gradient(180deg, rgba(28, 18, 12, 0.98) 0%, rgba(20, 12, 8, 0.99) 100%)',
                border: '1px solid rgba(78, 49, 28, 0.7)',
                borderRadius: '16px',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 14px 28px rgba(0, 0, 0, 0.7)',
                padding: '18px 22px'
              }}>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-6">
                  {/* Profile Picture - Mobile Friendly */}
                  <div className="relative">
                    {userProfile?.avatarUrl ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt={userProfile.userName || 'User'}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '9999px',
                          border: '1px solid rgba(231, 180, 93, 0.7)',
                          boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)',
                          cursor: 'pointer'
                        }}
                        className="object-cover hover:opacity-80 transition-opacity"
                        onClick={() => handleAvatarClick(userProfile.avatarUrl!, userProfile.userName || 'User')}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div 
                      className={`flex items-center justify-center ${userProfile?.avatarUrl ? 'hidden' : ''}`}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '9999px',
                        background: 'radial-gradient(circle at 35% 25%, #f1c980 0%, #b37a3c 55%, #7a4a21 100%)',
                        border: '1px solid rgba(231, 180, 93, 0.7)',
                        boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)'
                      }}
                    >
                      <span className="text-2xl font-bold text-[#2a1d12]">
                        {userProfile?.userName?.charAt(0).toUpperCase() || (user as any)?.username?.charAt(0).toUpperCase() || (user as any)?.name?.charAt(0).toUpperCase() || (user as any)?.unique_name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    
                    {/* Upload Button - Mobile Friendly */}
                    <div className="absolute -bottom-1 -right-1">
                      <label 
                        style={{
                          width: '28px',
                          height: '28px',
                          background: 'linear-gradient(180deg, rgba(60, 122, 87, 0.9) 0%, rgba(40, 82, 58, 0.95) 100%)',
                          borderRadius: '9999px',
                          border: '2px solid rgba(78, 49, 28, 0.7)',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                          cursor: 'pointer'
                        }}
                        className="flex items-center justify-center hover:opacity-90 active:scale-95 transition-all duration-200 touch-manipulation"
                      >
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
                          <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <h3 className="text-xl sm:text-2xl font-semibold text-[#F4EBD0] truncate" style={{ fontFamily: 'Arial, Helvetica, sans-serif', textTransform: 'none' }}>
                        {userProfile?.stats?.nickname || userProfile?.userName || (user as any)?.username || (user as any)?.name || (user as any)?.unique_name || 'User'}
                      </h3>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        border: '1px solid rgba(78, 49, 28, 0.7)',
                        background: 'rgba(60, 122, 87, 0.18)',
                        color: '#ccba93',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'none',
                        whiteSpace: 'nowrap'
                      }}>
                        {userPlayer?.guild || userPlayer?.Guild || 'No Guild'}
                      </span>
                    </div>

                    {/* Level and XP Bar - Mobile Friendly */}
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                      <span className="text-lg sm:text-xl font-semibold text-[#d4b077] font-medieval" style={{ textTransform: 'none' }}>
                        LVL {userProfile?.stats?.level || userPlayer?.level || 1}
                      </span>
                      <div 
                        style={{
                          flex: 1,
                          background: 'rgba(42, 29, 18, 0.8)',
                          borderRadius: '9999px',
                          height: '16px',
                          overflow: 'hidden',
                          border: '1px solid rgba(78, 49, 28, 0.5)',
                          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
                        }}
                      >
                        {(userProfile?.stats || userPlayer) ? (() => {
                          // Derive from actual XP to avoid mismatch with level calc
                          const xp = Math.max(0, userProfile?.stats?.xp || userPlayer?.xp || 0);
                          const levelBase = Math.floor(xp / 1000) * 1000;
                          const xpInCurrentLevel = xp - levelBase;
                          const xpPercentage = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / 1000) * 100)));
                          return (
                            <div 
                              style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #E7B45D 0%, #B17A3D 50%, #9C6B3E 100%)',
                                width: `${xpPercentage}%`,
                                transition: 'width 0.5s',
                                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                              }}
                            ></div>
                          );
                        })() : (
                          <div 
                            style={{
                              height: '100%',
                              background: 'linear-gradient(90deg, #E7B45D 0%, #B17A3D 50%, #9C6B3E 100%)',
                              width: '65%',
                              transition: 'width 0.5s',
                              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                            }}
                          ></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-[#9f8f79]" style={{ textTransform: 'none' }}>
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
                        <div className="text-xl sm:text-2xl font-bold text-[#60c878]" style={{ textTransform: 'none' }}>{userPlayer?.matchesPlayed || 0}</div>
                        <div className="text-xs text-[#B6AA96]" style={{ textTransform: 'none' }}>Games Played</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-[#60c878]" style={{ textTransform: 'none' }}>{userPlayer?.wins || 0}</div>
                        <div className="text-xs text-[#B6AA96]" style={{ textTransform: 'none' }}>Games Won</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-[#60c878]" style={{ textTransform: 'none' }}>{userPlayer ? Math.round(userPlayer.winRate * 100) : 0}%</div>
                        <div className="text-xs text-[#B6AA96]" style={{ textTransform: 'none' }}>Win Rate</div>
                      </div>
                    </div>

                    {/* Role Display */}
                    {(userPlayer?.role || userPlayer?.Role) && (
                      <div className="mt-4 text-center">
                        <span 
                          style={{
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            border: '1px solid rgba(231, 180, 93, 0.5)',
                            background: 'rgba(231, 180, 93, 0.15)',
                            color: '#d4b077',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'none'
                          }}
                        >
                          {(userPlayer?.role || userPlayer?.Role) === 'GM' ? '👑 Game Master' : `🎮 ${userPlayer?.role || userPlayer?.Role}`}
                        </span>
                      </div>
                    )}


                  </div>

                  {/* Achievements */}
                  <div className="flex flex-col space-y-2">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-[#d4b077] font-medieval" style={{ textTransform: 'none' }}>+{userPlayer?.totalScore || 0}</div>
                      <div className="text-xs text-[#9f8f79]" style={{ textTransform: 'none' }}>Total Points</div>
                    </div>
                    <div className="flex space-x-1 sm:space-x-2 justify-center">
                      {userPlayer?.mvps > 0 && (
                        <div 
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '9999px',
                            background: 'radial-gradient(circle at 35% 25%, #f1c980 0%, #b37a3c 55%, #7a4a21 100%)',
                            border: '1px solid rgba(231, 180, 93, 0.7)',
                            boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={`${userPlayer.mvps} MVP${userPlayer.mvps > 1 ? 's' : ''}`}
                        >
                          <span className="text-[#2a1d12] text-sm">⭐</span>
                        </div>
                      )}
                      {userPlayer?.tournamentsWon > 0 && (
                        <div 
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '9999px',
                            background: 'radial-gradient(circle at 35% 25%, #f1c980 0%, #b37a3c 55%, #7a4a21 100%)',
                            border: '1px solid rgba(231, 180, 93, 0.7)',
                            boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={`${userPlayer.tournamentsWon} Tournament Win${userPlayer.tournamentsWon > 1 ? 's' : ''}`}
                        >
                          <span className="text-[#2a1d12] text-sm">👑</span>
                        </div>
                      )}
                      {userPlayer?.wins > 0 && (
                        <div 
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '9999px',
                            background: '#2a1d12',
                            border: '1px solid rgba(156, 107, 62, 0.7)',
                            boxShadow: '0 0 6px rgba(0, 0, 0, 0.55)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={`${userPlayer.wins} Win${userPlayer.wins > 1 ? 's' : ''}`}
                        >
                          <span className="text-[#d4b077] text-sm">🏆</span>
                        </div>
                      )}
                      {(!userPlayer || (userPlayer.mvps === 0 && userPlayer.tournamentsWon === 0 && userPlayer.wins === 0)) && (
                        <div 
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '9999px',
                            background: 'rgba(42, 29, 18, 0.6)',
                            border: '1px solid rgba(78, 49, 28, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="No achievements yet"
                        >
                          <span className="text-[#9f8f79] text-sm">🎯</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            
          </div>

          {/* Right Sidebar - Tournaments List */}
          <div className="w-full lg:w-96 flex-shrink-0 relative">
            {/* Stardust around Board Games */}
            <div className="absolute -top-4 -left-4 w-6 h-6 bg-orange-400 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.8s' }} />
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-emerald-400 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-8 -left-6 w-2 h-2 bg-orange-400 rounded-full opacity-70 animate-pulse" style={{ animationDelay: '2.2s' }} />
            <div className="absolute top-16 -right-4 w-4 h-4 bg-emerald-300 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.3s' }} />
            <div className="absolute top-24 -left-2 w-1 h-1 bg-white rounded-full opacity-90 animate-pulse" style={{ animationDelay: '1.8s' }} />
            <div className="absolute top-32 -right-6 w-3 h-3 bg-emerald-400 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '2.7s' }} />
            
            {/* Floating stardust particles */}
            <div className="absolute top-12 left-2 w-1 h-1 bg-orange-400 rounded-full opacity-80 animate-ping" style={{ animationDuration: '3s', animationDelay: '1.2s' }} />
            <div className="absolute top-20 right-1 w-1 h-1 bg-orange-400 rounded-full opacity-70 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '2.8s' }} />
            <div className="absolute top-28 left-1 w-1 h-1 bg-emerald-400 rounded-full opacity-90 animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
            
            {/* Cosmic dust near board games */}
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-gradient-radial from-orange-500/5 via-emerald-500/3 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
            <div className="absolute -top-4 -right-8 w-24 h-24 bg-gradient-radial from-orange-500/6 via-emerald-500/2 to-transparent rounded-full blur-xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '2.5s' }} />
            
            <div className="medieval-panel p-4 sm:p-6 shadow-lg lg:sticky lg:top-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#F4EBD0] medieval-heading">Tournaments</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchTournaments}
                    style={{
                      padding: '6px 12px',
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
                    Refresh
                  </button>
                  {isGM && (
                    <button 
                      onClick={() => setIsCreateTournamentExpanded(!isCreateTournamentExpanded)}
                      style={{
                        padding: '8px',
                        background: 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                        border: '1px solid rgba(156, 107, 62, 0.7)',
                        borderRadius: '8px',
                        color: '#2A1D12',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.3s',
                        cursor: 'pointer'
                      }}
                      className="hover:opacity-90"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="#2A1D12" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search tournaments..."
                    className="w-full pl-10 pr-4 py-3 bg-[#2A1D12]/90 border border-[#9C6B3E]/50 rounded-lg text-[#F4EBD0] placeholder-[#B6AA96] focus:outline-none focus:ring-2 focus:ring-[#E7B45D]/60 focus:border-[#E7B45D]/40 transition-all"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-[#E7B45D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <p className="text-orange-300 text-lg">Loading tournaments...</p>
                  </div>
                ) : tournaments.length > 0 ? tournaments.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => openTournamentModal(t, false)}
                    style={{
                      background: 'linear-gradient(180deg, rgba(28, 18, 12, 0.98) 0%, rgba(20, 12, 8, 0.99) 100%)',
                      border: '1px solid rgba(78, 49, 28, 0.7)',
                      borderRadius: '16px',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 14px 28px rgba(0, 0, 0, 0.7)',
                      padding: '18px 22px',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    className="group hover:bg-[#3B2A1E]/85 hover:border-[#E7B45D]/60"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Game Icon */}
                      <div 
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '9999px',
                          background: 'radial-gradient(circle at 35% 25%, #f1c980 0%, #b37a3c 55%, #7a4a21 100%)',
                          border: '1px solid rgba(231, 180, 93, 0.7)',
                          boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.28), 0 6px 14px rgba(231, 180, 93, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          flexShrink: 0
                        }}
                      >
                        🏟️
                      </div>
                      
                      {/* Game Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[#F4EBD0] font-semibold text-base truncate" style={{ fontFamily: 'Arial, Helvetica, sans-serif', textTransform: 'none' }}>
                          {t.name}
                        </h3>
                        <p className="text-[#B6AA96] text-xs mb-1">{t.game}</p>
                        <p className="text-[#B6AA96] text-xs mb-2">
                          GM: {t.gameMasterUsername || 'Unknown'}
                        </p>
                        
                        {/* Game Details - Flexible layout */}
                        <div className="space-y-2">
                          {/* Details with flex-wrap */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#B6AA96]">
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
                              {new Date(t.tournamentDate).toLocaleDateString('de-DE')}
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
                            <svg className="w-4 h-4 text-orange-300 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span className="text-orange-300 text-xs font-medium truncate">{t.name}</span>
                          </div>
                          
                          <span 
                            style={{
                              padding: '2px 10px',
                              borderRadius: '9999px',
                              border: `1px solid ${t.memberCount < t.maxMembers ? 'rgba(60, 122, 87, 0.8)' : 'rgba(78, 49, 28, 0.7)'}`,
                              background: t.memberCount < t.maxMembers ? 'rgba(60, 122, 87, 0.18)' : 'rgba(60, 122, 87, 0.08)',
                              color: t.memberCount < t.maxMembers ? '#d7ead3' : '#ccba93',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                          >
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
                            style={{
                              padding: '6px 12px',
                              background: 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                              border: '1px solid rgba(156, 107, 62, 0.7)',
                              borderRadius: '8px',
                              color: '#2A1D12',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                              transition: 'all 0.3s'
                            }}
                            className="hover:opacity-90"
                          >
                            View Members
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <div className="text-amber-300 text-lg">No tournaments available</div>
                    <div className="text-amber-300/80 text-sm mt-2">Tournaments will appear here as they are created</div>
                  </div>
                )}
              </div>

              {/* View All Button */}
              <div className="mt-6 pt-4 border-t border-amber-900/50">
                <button 
                  style={{
                    width: '100%',
                    padding: '12px 0',
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
                  View All Tournaments
                </button>
              </div>

            </div>

            {/* Guild Button - Separate Container */}
            <div className="mt-10 sm:mt-12">
              <button
                onClick={() => router.push('/guild')}
                style={{
                  width: '100%',
                  padding: '16px 0',
                  background: 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                  border: '1px solid rgba(156, 107, 62, 0.7)',
                  borderRadius: '12px',
                  color: '#2A1D12',
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
                className="hover:opacity-90"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xl font-bold">Guild</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Management Modal */}
      {isTournamentModalOpen && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-xl border-2 border-amber-900/40 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden relative"
            style={{
              backgroundColor: 'rgb(68, 36, 19)',
              background: 'linear-gradient(to bottom right, rgb(68, 36, 19) 0%, rgb(87, 44, 23) 50%, rgb(68, 36, 19) 100%)',
              backgroundImage: `
                linear-gradient(90deg, transparent 0%, rgba(68, 36, 19, 0.06) 50%, transparent 100%),
                linear-gradient(0deg, rgba(68, 36, 19, 0.03) 0%, transparent 30%, rgba(68, 36, 19, 0.03) 50%, transparent 70%, rgba(68, 36, 19, 0.03) 100%)
              `,
              backgroundSize: '100% 3px, 100% 30px',
              opacity: '1'
            }}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-amber-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-orange-300">{selectedTournament.name}</h2>
                  <p className="text-amber-300">{selectedTournament.game}</p>
                </div>
                <button
                  onClick={closeTournamentModal}
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
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Tournament Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-orange-300">Tournament Stats</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-amber-950/70 rounded-lg p-3 border border-amber-900/40 min-w-0">
                      <div className="text-xl font-bold text-orange-300 truncate">{selectedTournament.memberCount}</div>
                      <div className="text-xs text-amber-300 truncate">Current Members</div>
                    </div>
                    <div className="bg-amber-950/70 rounded-lg p-3 border border-amber-900/40 min-w-0">
                      <div className="text-xl font-bold text-orange-300 truncate">{selectedTournament.maxMembers}</div>
                      <div className="text-xs text-amber-300 truncate">Max Members</div>
                    </div>
                    <div className="bg-amber-950/70 rounded-lg p-3 border border-amber-900/40 min-w-0">
                      <div className="text-xl font-bold text-orange-300 truncate">{selectedTournament.xpReward || 100}</div>
                      <div className="text-xs text-amber-300 truncate">XP Reward</div>
                    </div>
                    <div className="bg-amber-950/70 rounded-lg p-3 border border-amber-900/40 min-w-0">
                      <div className="text-xl font-bold text-orange-300 truncate">{selectedTournament.mvpXpReward || 50}</div>
                      <div className="text-xs text-amber-300 truncate">MVP XP Reward</div>
                    </div>
                  </div>

                  <div className="bg-amber-950/70 rounded-lg p-4 border border-amber-900/40">
                    <div className="text-sm text-amber-300 mb-2">Tournament Date</div>
                    <div className="text-orange-300 font-semibold">
                      {new Date(selectedTournament.tournamentDate).toLocaleDateString('de-DE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="bg-amber-950/70 rounded-lg p-4 border border-amber-900/40">
                    <div className="text-sm text-amber-300 mb-2">Status</div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedTournament.phase === 0 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                        : selectedTournament.phase === 1
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                        : selectedTournament.phase === 2
                        ? 'bg-amber-800/40 text-amber-300 border border-amber-900/50'
                        : selectedTournament.phase === 3
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                        : 'bg-red-500/20 text-red-300 border border-red-400/30'
                    }`}>
                      {getPhaseDisplayName(selectedTournament.phase)}
                    </span>
                  </div>

                  <div className="bg-amber-950/70 rounded-lg p-4 border border-amber-900/40">
                    <div className="text-sm text-amber-300 mb-2">Game Master</div>
                    <div className="text-orange-300 font-semibold">
                      {selectedTournament.gameMasterUsername || 'Unknown GM'}
                    </div>
                  </div>
                </div>

                {/* Tournament Members */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-orange-300">Tournament Members</h3>
                    {/* Only show Add Player functionality for tournaments from My Tournaments section and not finished */}
                    {selectedTournament && isFromMyTournaments && selectedTournament.phase !== 2 && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openAddMemberModal(selectedTournament)}
                          style={{
                            padding: '8px 16px',
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
                          Add Member
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-amber-950/70 rounded-lg border border-amber-900/40 max-h-80 overflow-y-auto">
                    {membersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mr-2"></div>
                        <p className="text-orange-300">Loading members...</p>
                      </div>
                    ) : tournamentMembers.length > 0 ? (
                      <div className="space-y-2 p-4">
                        {tournamentMembers.map((member: any, index: number) => (
                          <div key={member.id} className="flex items-center justify-between bg-amber-900/60 rounded-lg p-3 min-w-0">
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <div className="relative flex-shrink-0">
                                {member.avatarUrl ? (
                                  <img
                                    src={member.avatarUrl}
                                    alt={member.nickname || 'Player'}
                                    className="w-8 h-8 rounded-full object-cover border border-amber-400"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <div className={`w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center ${member.avatarUrl ? 'hidden' : ''}`}>
                                  <span className="text-sm font-bold text-white">
                                    {member.nickname?.charAt(0).toUpperCase() || 'P'}
                                  </span>
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-amber-300 font-medium text-sm truncate">{member.nickname}</div>
                                <div className="text-amber-300/80 text-xs truncate">
                                  Joined: {new Date(member.joinedAt).toLocaleDateString('de-DE')}
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
                        <div className="text-amber-300 text-lg">No members yet</div>
                        <div className="text-amber-300/80 text-sm mt-2">Players will appear here when they join</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tournament Finished Banner */}
              {selectedTournament.phase === 2 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-amber-950/70 via-amber-900/70 to-amber-950/70 border border-amber-900/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-amber-300 font-semibold">Tournament Finished</h3>
                      <p className="text-amber-300 text-sm">This tournament has been completed. XP rewards have been distributed and no further changes can be made.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-amber-900/40">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button 
                      disabled={selectedTournament.phase === 2}
                      style={{
                        padding: '8px 12px',
                        background: selectedTournament.phase === 2 
                          ? 'linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%)'
                          : 'linear-gradient(180deg, rgba(60, 122, 87, 0.9) 0%, rgba(40, 82, 58, 0.95) 100%)',
                        border: '1px solid rgba(156, 107, 62, 0.7)',
                        borderRadius: '8px',
                        color: selectedTournament.phase === 2 ? '#999' : '#F4EBD0',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 4px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.3s',
                        cursor: selectedTournament.phase === 2 ? 'not-allowed' : 'pointer'
                      }}
                      className={selectedTournament.phase === 2 ? '' : 'hover:opacity-90'}
                    >
                      {selectedTournament.phase === 2 ? 'Tournament Finished' : 'Start Tournament'}
                    </button>
                    <button 
                      onClick={openUpdateModal}
                      disabled={selectedTournament.phase === 2}
                      style={{
                        padding: '8px 12px',
                        background: selectedTournament.phase === 2 
                          ? 'linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%)'
                          : 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                        border: '1px solid rgba(156, 107, 62, 0.7)',
                        borderRadius: '8px',
                        color: selectedTournament.phase === 2 ? '#999' : '#2A1D12',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.3s',
                        cursor: selectedTournament.phase === 2 ? 'not-allowed' : 'pointer'
                      }}
                      className={selectedTournament.phase === 2 ? '' : 'hover:opacity-90'}
                    >
                      {selectedTournament.phase === 2 ? 'Tournament Finished' : 'Edit Tournament'}
                    </button>
                    <button 
                      onClick={openEndModal}
                      disabled={selectedTournament.phase === 2}
                      style={{
                        padding: '8px 12px',
                        background: selectedTournament.phase === 2 
                          ? 'linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%)'
                          : 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                        border: '1px solid rgba(156, 107, 62, 0.7)',
                        borderRadius: '8px',
                        color: selectedTournament.phase === 2 ? '#999' : '#2A1D12',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.3s',
                        cursor: selectedTournament.phase === 2 ? 'not-allowed' : 'pointer'
                      }}
                      className={selectedTournament.phase === 2 ? '' : 'hover:opacity-90'}
                    >
                      {selectedTournament.phase === 2 ? 'Tournament Finished' : 'Finish Tournament'}
                    </button>
                  </div>
                  <button
                    onClick={closeTournamentModal}
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
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-2xl p-6 max-w-md w-full border border-amber-900/60">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-amber-300">
                {selectedAvatar.nickname}'s Avatar
              </h3>
              <button
                onClick={handleAvatarModalClose}
                className="text-amber-300 hover:text-orange-300 transition-colors p-2 hover:bg-amber-950/80 rounded-full"
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
                  <span className="text-6xl font-bold text-white">
                    {selectedAvatar.nickname.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="text-center">
              <p className="text-amber-300 text-sm">
                Click outside or press ESC to close
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 