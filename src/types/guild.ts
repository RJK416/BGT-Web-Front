export enum GuildRole {
  Leader = 0,
  Officer = 1,
  Member = 2
}

export enum InviteStatus {
  Pending = 1,
  Accepted = 2,
  Declined = 3,
  Expired = 4
}

export interface GuildMember {
  playerId: number;
  playerName: string;
  role: string;
  joinedAt: string;
  playerLevel?: number;
}

export interface GuildInvitation {
  id: number;
  guildId: number;
  inviterId: number;
  invitedId: number;
  message?: string;
  created: string;
  expiresAt: string;
  status: InviteStatus;
  guild: {
    id: number;
    name: string;
    description?: string;
    memberCount: number;
    maxMembers: number;
  };
  inviter: {
    nickname: string;
    avatarUrl?: string;
  };
}

export interface Guild {
  id: number;
  name: string;
  description?: string;
  creatorName: string;
  created: string;
  level: number;
  emblemUrl?: string;
  memberCount: number;
  maxMember: number;
  userRole: string;
  joinedAt: string;
  members: GuildMember[];
}

export interface CreateGuildRequest {
  name: string;
  description?: string;
  maxMembers?: number;
}

export interface GuildInvitationRequest {
  GuildId: number;
  Username: string;
  Message?: string;
  ExpiresInDays?: number;
}

export interface GuildInvitationResponse {
  inviteId: number;
  status: InviteStatus;
  dateTime: string;
}

export interface GuildListResponse {
  status: number;
  message: string;
  data: {
    guilds: Guild[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  isSuccess: boolean;
}

export interface GuildResponse {
  status: number;
  message: string;
  data: Guild;
  isSuccess: boolean;
}

export interface GuildMembersResponse {
  status: number;
  message: string;
  data: GuildMember[];
  isSuccess: boolean;
}

export interface GuildInvitationsResponse {
  status: number;
  message: string;
  data: GuildInvitation[];
  isSuccess: boolean;
}

export interface GuildActionResponse {
  status: number;
  message: string;
  data: boolean;
  isSuccess: boolean;
}
