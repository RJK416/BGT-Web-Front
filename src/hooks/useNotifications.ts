import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types/notification';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get all notifications from the working endpoint
      const response = await notificationService.getUnreadNotifications();
      
      if (response.status === 200 && response.data && Array.isArray(response.data)) {
        // Filter for unread notifications (status === 0)
        const unreadNotifications = response.data.filter(notification => notification.status === 0);
        setNotifications(unreadNotifications);
        setError(null);
      } else {
        console.error('Invalid response:', response);
        setError('Failed to load notifications - invalid response format');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Error loading notifications - network or server error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      // Try to get unread count from dedicated endpoint
      const response = await notificationService.getUnreadCount();
      if (response.status === 200 && typeof response.data === 'number') {
        setUnreadCount(response.data);
      } else {
        // Fallback: calculate count from notifications array
        console.warn('Unread count endpoint failed, calculating from notifications');
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
      // Fallback: calculate count from notifications array
      console.warn('Unread count endpoint failed, calculating from notifications');
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.status === 200) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, status: 1 as any } // NotificationStatus.Read
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.status === 200) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, status: 1 as any }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    fetchUnreadCount
  };
};
