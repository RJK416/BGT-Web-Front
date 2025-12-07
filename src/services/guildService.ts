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


  async getUserPlayer(): Promise<any> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.BOARDGAME.GET_USER_PLAYER);
    return await apiRequest(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async appointGMByUsername(username: string): Promise<GuildActionResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.BOARDGAME.APPOINT_GM_BY_USERNAME);
    return await apiRequest(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ Username: username }),
    });
  }

  async uploadEmblem(file: File): Promise<GuildActionResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('file', file);

    const url = buildApiUrl(API_CONFIG.ENDPOINTS.GUILD.UPLOAD_EMBLEM);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    
    if (!response.ok || result.status !== 200) {
      throw new Error(result.error || result.message || 'Failed to upload emblem');
    }

    return {
      status: result.status || 200,
      message: result.message || 'Emblem uploaded successfully',
      data: result.data !== undefined ? result.data : true,
      isSuccess: result.status === 200,
    };
  }

  async disbandGuild(): Promise<GuildActionResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.GUILD.DISBAND_GUILD);
    return await apiRequest(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  async leaveGuild(): Promise<GuildActionResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.GUILD.LEAVE_GUILD);
    return await apiRequest(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });
  }
}

export const guildService = new GuildService();
