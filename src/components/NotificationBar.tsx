'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationType } from '../types/notification';

interface NotificationBarProps {
  className?: string;
}

const NotificationBar: React.FC<NotificationBarProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    fetchUnreadCount
  } = useNotifications();

  // Set up polling for real-time updates (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Update button position when opening
  const updateButtonPosition = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: number) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };


  const handleToggleDropdown = () => {
    if (!isOpen) {
      updateButtonPosition();
    }
    setIsOpen(!isOpen);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 0: // GuildInvite
        return '🏰';
      case 1: // GuildInviteApproved
        return '✅';
      case 2: // GuildInviteRejected
        return '❌';
      case 3: // TournamentInvite
        return '🏆';
      case 4: // TournamentUpdate
        return '📢';
      case 5: // MatchResult
        return '🎯';
      case 6: // SystemMessage
        return '📋';
      case 7: // FriendRequest
        return '👥';
      case 8: // AchievementUnlocked
        return '🏅';
      default:
        return '📬';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div 
      className={`relative ${className}`} 
      ref={dropdownRef}
      style={{ zIndex: 999999, transform: 'translateZ(0)' }}
    >
      {/* Notification Bell Button */}
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className="relative p-2 text-purple-900 hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-full transition-all duration-200 bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 shadow-lg shadow-amber-400/30"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z"
          />
        </svg>
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Portal */}
      {isOpen && buttonRect && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-80 bg-gradient-to-br from-purple-950/90 to-purple-900/90 rounded-xl shadow-2xl border-2 border-amber-400/30 max-h-96 overflow-hidden"
          style={{ 
            top: buttonRect.bottom + 8,
            right: window.innerWidth - buttonRect.right,
            zIndex: 999999,
            transform: 'translateZ(0)'
          }}
        >
          {/* Header */}
          <div className="px-4 py-4 bg-gradient-to-br from-purple-950/90 to-purple-900/90 border-b-2 border-purple-400 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg border border-emerald-400">
                <span className="text-emerald-100 text-lg">🔔</span>
              </div>
              <h3 className="text-lg font-bold text-amber-300 drop-shadow-sm">Notifications</h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Mark all read
              </button>
            )}
          </div>


          {/* Content */}
          <div className="max-h-80 overflow-y-auto bg-gradient-to-br from-purple-800/50 to-purple-700/50">
            {isLoading ? (
              <div className="p-4 text-center text-amber-300">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400 mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-400">
                <p>{error}</p>
                <button
                  onClick={refreshNotifications}
                  className="mt-2 text-sm text-amber-400 hover:text-amber-300"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-amber-300">
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                      notification.status === 0 ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {formatDate(notification.create)}
                          </p>
                          {notification.status === 0 && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={refreshNotifications}
                className="w-full text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Refresh notifications
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationBar;
