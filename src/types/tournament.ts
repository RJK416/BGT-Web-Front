// Tournament Types
export interface UpdateBoardgameTournamentRequest {
  tournamentId: number;
  name?: string;
  game?: string;
  tournamentDate?: Date;
  maxMembers?: number;
  memberCount?: number;
  xpReward?: number;
  mvpXpReward?: number;
  phase?: TournamentPhase;
  winnerId?: number;
  mvpId?: number;
}

export interface CreateBoardgameTournamentRequest {
  name: string;
  game: string;
  tournamentDate: Date;
  maxMembers: number;
  memberCount?: number;
  xpReward?: number;
  mvpXpReward?: number;
  phase?: TournamentPhase;
}

export enum TournamentPhase {
  Registration = 0,
  Started = 1,
  Finished = 2,
  Postponed = 3,
  Cancelled = 4
}

// Helper function to get phase display name
export const getPhaseDisplayName = (phase: TournamentPhase): string => {
  switch (phase) {
    case TournamentPhase.Registration:
      return 'Registration';
    case TournamentPhase.Started:
      return 'Started';
    case TournamentPhase.Finished:
      return 'Finished';
    case TournamentPhase.Postponed:
      return 'Postponed';
    case TournamentPhase.Cancelled:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

export interface TournamentMember {
  id: number;
  playerId: number;
  nickname: string;
  joinedAt: string;
  placement?: number;
  score?: number;
  avatarUrl?: string;
}

export interface Tournament {
  id: number;
  name: string;
  game: string;
  tournamentDate: string;
  maxMembers: number;
  memberCount: number;
  xpReward: number;
  mvpXpReward: number;
  phase: TournamentPhase;
  winnerId?: number;
  mvpId?: number;
  gameMasterUsername?: string;
}
