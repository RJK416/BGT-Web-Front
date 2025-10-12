import { buildApiUrl, apiRequest } from '../config/api';
import { API_CONFIG } from '../config/api';
import type { 
  Notification, 
  NotificationResponse, 
  NotificationCountResponse, 
  NotificationActionResponse 
} from '../types/notification';

class NotificationService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getAllNotifications(): Promise<NotificationResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.GET_ALL);
    return await apiRequest(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getUnreadNotifications(): Promise<NotificationResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.GET_UNREAD);
    return await apiRequest(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getUnreadCount(): Promise<NotificationCountResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.GET_UNREAD_COUNT);
    return await apiRequest(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async markAsRead(notificationId: number): Promise<NotificationActionResponse> {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICATION.MARK_AS_READ}/${notificationId}`);
    return await apiRequest(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });
  }

  async markAllAsRead(): Promise<NotificationActionResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.MARK_ALL_AS_READ);
    return await apiRequest(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });
  }
}

export const notificationService = new NotificationService();
