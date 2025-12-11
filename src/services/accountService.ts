import { API_CONFIG, apiRequest, buildApiUrl } from '@/config/api';
import { getAuthToken } from '@/utils/auth';

export interface QrCodeResponse {
  dataUrl: string;
  payload: string;
  status?: number;
  message?: string;
  error?: string;
  ok?: boolean;
}

class AccountService {
  private getAuthHeaders() {
    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async getQrCode(): Promise<QrCodeResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.ACCOUNT.QR_CODE);
    return await apiRequest(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }
}

export const accountService = new AccountService();

