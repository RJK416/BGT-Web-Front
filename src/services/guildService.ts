import { buildApiUrl, apiRequest } from '../config/api';
import { getAuthToken } from '@/utils/auth';
import { API_CONFIG } from '../config/api';
import type { 
  Guild, 
  GuildMember, 
  GuildInvitation,
  CreateGuildRequest,
  GuildInvitationRequest,
  GuildInvitationResponse,
  GuildListResponse,
  GuildResponse,
  GuildMembersResponse,
  GuildInvitationsResponse,
  GuildActionResponse,
  AppointGMRequest
} from '../types/guild';

class GuildService {
  private getAuthHeaders() {
    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async createGuild(request: CreateGuildRequest): Promise<GuildActionResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.GUILD.ADD);
    return await apiRequest(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });
  }

  async getMyGuild(): Promise<GuildResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.GUILD.GET_MY_GUILD);
    return await apiRequest(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getAllGuilds(page: number = 1, pageSize: number = 10): Promise<GuildListResponse> {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.GUILD.GET_ALL}?page=${page}&pageSize=${pageSize}`);
    return await apiRequest(url, { method: 'GET', headers: this.getAuthHeaders() }) as unknown as GuildListResponse;
  }

  async getGuildById(guildId: number): Promise<GuildResponse> {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.GUILD.GET_BY_ID}/${guildId}`);
    return await apiRequest(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getGuildByName(guildName: string): Promise<GuildResponse> {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.GUILD.GET_BY_NAME}/${encodeURIComponent(guildName)}`);
    return await apiRequest(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async sendInvitation(request: GuildInvitationRequest): Promise<GuildActionResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.GUILD.SEND_INVITATION);
    return await apiRequest(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });
  }

  async respondToInvitation(request: GuildInvitationResponse): Promise<GuildActionResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.GUILD.RESPOND_INVITATION);
    return await apiRequest(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });
  }

  async getGuildMemberByUsername(username: string): Promise<GuildResponse> {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.GUILD.GET_MEMBER_BY_USERNAME}/${encodeURIComponent(username)}`);
    return await apiRequest(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getMyInvitations(): Promise<GuildInvitationsResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.GUILD.GET_MY_INVITATIONS);
    return await apiRequest(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getAllGuildMembers(): Promise<GuildMembersResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.GUILD.GET_ALL_MEMBERS);
    return await apiRequest(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getMyGuildMembers(): Promise<GuildMembersResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.GUILD.GET_MY_MEMBERS);
    return await apiRequest(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async appointGM(request: AppointGMRequest): Promise<GuildActionResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.GUILD.APPOINT_GM);
    return await apiRequest(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });
  }
}

export const guildService = new GuildService();
