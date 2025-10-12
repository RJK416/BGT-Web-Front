'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationType } from '../types/notification';

interface NotificationBarProps {
  className?: string;
}

const NotificationBar: React.FC<NotificationBarProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
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

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Mobile touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isOpen) return;
    
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchStartX(touch.clientX);
    setIsDragging(true);
    setSwipeDirection(null);
  }, [isMobile, isOpen]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isOpen || !isDragging) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartY;
    const deltaX = Math.abs(touch.clientX - touchStartX);
    
    // Only consider vertical swipes
    if (deltaX < 50) {
      if (deltaY > 50) {
        setSwipeDirection('down');
      } else if (deltaY < -50) {
        setSwipeDirection('up');
      }
    }
  }, [isMobile, isOpen, isDragging, touchStartY, touchStartX]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isOpen || !isDragging) return;
    
    setIsDragging(false);
    
    if (swipeDirection === 'down') {
      // Swipe down to close
      setIsOpen(false);
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } else if (swipeDirection === 'up' && contentRef.current) {
      // Swipe up to refresh
      refreshNotifications();
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }
    }
    
    setSwipeDirection(null);
  }, [isMobile, isOpen, isDragging, swipeDirection, refreshNotifications]);

  // Pull to refresh functionality
  const handlePullToRefresh = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isOpen) return;
    
    const touch = e.touches[0];
    const contentElement = contentRef.current;
    
    if (contentElement && contentElement.scrollTop === 0 && touch.clientY > touchStartY + 50) {
      refreshNotifications();
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }
    }
  }, [isMobile, isOpen, touchStartY, refreshNotifications]);

  const handleMarkAsRead = async (notificationId: number) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };


  const handleToggleDropdown = () => {
    if (!isOpen) {
      updateButtonPosition();
      // Haptic feedback for opening on mobile
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(30);
      }
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
          className={`fixed bg-gradient-to-br from-purple-950/90 to-purple-900/90 shadow-2xl border-2 border-amber-400/30 overflow-hidden transition-all duration-300 ${
            isMobile 
              ? 'w-full max-w-sm mx-auto rounded-t-xl max-h-[80vh] notification-mobile' 
              : 'w-80 rounded-xl max-h-96'
          }`}
          style={{ 
            ...(isMobile 
              ? {
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%) translateZ(0)',
                  zIndex: 999999
                }
              : {
                  top: buttonRect.bottom + 8,
                  right: window.innerWidth - buttonRect.right,
                  transform: 'translateZ(0)',
                  zIndex: 999999
                }
            )
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header */}
          <div className={`px-4 bg-gradient-to-br from-purple-950/90 to-purple-900/90 border-b-2 border-purple-400 flex items-center justify-between ${
            isMobile ? 'py-3' : 'py-4'
          } ${isMobile ? 'rounded-t-xl' : 'rounded-t-lg'}`}>
            <div className="flex items-center space-x-3">
              <div className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} bg-emerald-600 rounded-full flex items-center justify-center shadow-lg border border-emerald-400`}>
                <span className={`text-emerald-100 ${isMobile ? 'text-base' : 'text-lg'}`}>🔔</span>
              </div>
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-amber-300 drop-shadow-sm`}>Notifications</h3>
            </div>
            <div className="flex items-center space-x-2">
              {isMobile && unreadCount > 0 && (
                <span className="text-xs text-amber-300 font-medium">
                  {unreadCount} unread
                </span>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation`}
                >
                  {isMobile ? 'Mark All' : 'Mark all read'}
                </button>
              )}
              {isMobile && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-purple-300 hover:text-amber-400 transition-colors touch-manipulation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Mobile swipe indicator */}
          {isMobile && (
            <div className="flex justify-center py-2 bg-purple-800/30">
              <div className="w-8 h-1 bg-amber-400/50 rounded-full"></div>
            </div>
          )}


          {/* Content */}
          <div 
            ref={contentRef}
            className={`${isMobile ? 'max-h-[60vh]' : 'max-h-80'} overflow-y-auto bg-gradient-to-br from-purple-800/50 to-purple-700/50 custom-scrollbar`}
            onTouchStart={handlePullToRefresh}
          >
            {isLoading ? (
              <div className={`${isMobile ? 'p-6' : 'p-4'} text-center text-amber-300`}>
                <div className={`animate-spin rounded-full border-b-2 border-amber-400 mx-auto ${isMobile ? 'h-8 w-8' : 'h-6 w-6'}`}></div>
                <p className={`${isMobile ? 'mt-3 text-base' : 'mt-2 text-sm'}`}>Loading notifications...</p>
              </div>
            ) : error ? (
              <div className={`${isMobile ? 'p-6' : 'p-4'} text-center text-red-400`}>
                <p className={`${isMobile ? 'text-base' : 'text-sm'}`}>{error}</p>
                <button
                  onClick={refreshNotifications}
                  className={`mt-3 ${isMobile ? 'text-base px-4 py-2 bg-amber-500/20 rounded-lg' : 'text-sm'} text-amber-400 hover:text-amber-300 touch-manipulation transition-colors`}
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className={`${isMobile ? 'p-6' : 'p-4'} text-center text-amber-300`}>
                <div className={`${isMobile ? 'text-4xl mb-3' : 'text-2xl mb-2'}`}>📭</div>
                <p className={`${isMobile ? 'text-base' : 'text-sm'}`}>No notifications</p>
                {isMobile && (
                  <p className="text-xs text-amber-400 mt-1">Pull down to refresh</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-purple-600/30">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${isMobile ? 'p-4' : 'p-4'} hover:bg-purple-700/30 active:bg-purple-700/50 cursor-pointer transition-all duration-150 touch-manipulation ${
                      notification.status === 0 ? 'bg-blue-500/10 border-l-4 border-l-blue-400' : ''
                    }`}
                    onClick={() => {
                      handleMarkAsRead(notification.id);
                      // Haptic feedback for mobile
                      if (isMobile && 'vibrate' in navigator) {
                        navigator.vibrate(25);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 ${isMobile ? 'text-xl' : 'text-lg'}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`${isMobile ? 'text-sm leading-relaxed' : 'text-sm leading-relaxed'} text-purple-100`}>
                          {notification.message}
                        </p>
                        <div className={`${isMobile ? 'mt-2' : 'mt-1'} flex items-center justify-between`}>
                          <p className={`text-xs text-purple-400`}>
                            {formatDate(notification.create)}
                          </p>
                          <div className="flex items-center space-x-2">
                            {notification.status === 0 && (
                              <div className={`${isMobile ? 'w-3 h-3' : 'w-2 h-2'} bg-blue-400 rounded-full animate-pulse`}></div>
                            )}
                            {isMobile && notification.status === 0 && (
                              <span className="text-xs text-blue-400 font-medium">Tap to read</span>
                            )}
                          </div>
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
            <div className={`${isMobile ? 'px-4 py-3' : 'px-4 py-3'} border-t border-purple-600/30 bg-purple-800/30`}>
              <button
                onClick={() => {
                  refreshNotifications();
                  // Haptic feedback for mobile
                  if (isMobile && 'vibrate' in navigator) {
                    navigator.vibrate([30, 30, 30]);
                  }
                }}
                className={`w-full ${isMobile ? 'text-sm px-4 py-3' : 'text-sm'} text-amber-400 hover:text-amber-300 font-medium touch-manipulation transition-colors bg-amber-500/10 hover:bg-amber-500/20 rounded-lg`}
              >
                {isMobile ? '🔄 Pull to refresh notifications' : 'Refresh notifications'}
              </button>
              {isMobile && (
                <div className="text-center mt-2">
                  <p className="text-xs text-purple-400">
                    Swipe down to close • Swipe up to refresh
                  </p>
                </div>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationBar;
