'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '../hooks/useNotifications';
import { guildService } from '../services/guildService';
import type { NotificationType } from '../types/notification';
import type { InviteStatus } from '../types/guild';

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
  const [respondingToInvite, setRespondingToInvite] = useState<number | null>(null);
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

  const handleGuildInviteResponse = async (notificationId: number, inviteId: number, status: InviteStatus) => {
    try {
      setRespondingToInvite(inviteId);
      
      // Haptic feedback for mobile
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }

      const response = await guildService.respondToInvitation({
        inviteId,
        status,
        dateTime: new Date().toISOString()
      });

      if (response.isSuccess) {
        // Mark notification as read
        await markAsRead(notificationId);
        
        // Refresh notifications to show updated state
        await refreshNotifications();
        
        // Success feedback
        if (isMobile && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      } else {
        // Error feedback
        if (isMobile && 'vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
        console.error('Failed to respond to guild invite:', response.message);
      }
    } catch (error) {
      console.error('Error responding to guild invite:', error);
      // Error feedback
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } finally {
      setRespondingToInvite(null);
    }
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

  const getNotificationMessage = (type: NotificationType, notification?: any) => {
    switch (type) {
      case 0: 
        if (notification && (notification as any).guild && (notification as any).guild.name) {
          return `You have been invited to the "${(notification as any).guild.name}" Guild!`;
        }
        return 'You have received a guild invitation!';
      case 1: return 'Your guild invitation has been accepted!';
      case 2: return 'Your guild invitation was declined.';
      case 3: return 'You have been invited to a tournament!';
      case 4: return 'There\'s an update about a tournament you\'re in.';
      case 5: return 'Your match results are ready!';
      case 6: return 'You have a new system message.';
      case 7: return 'You have received a friend request!';
      case 8: return 'Congratulations! You\'ve unlocked an achievement!';
      default: return 'You have a new notification.';
    }
  };

  const getNotificationTypeInfo = (type: NotificationType) => {
    switch (type) {
      case 0: // GuildInvite
        return {
          title: 'Message from guild',
          color: 'from-blue-500 to-purple-600',
          bgColor: 'from-blue-500/10 to-purple-600/10',
          borderColor: 'border-blue-400/30',
          iconBg: 'bg-gradient-to-br from-blue-500 to-purple-600'
        };
      case 1: // GuildInviteApproved
        return {
          title: 'Invite Accepted',
          color: 'from-green-500 to-emerald-600',
          bgColor: 'from-green-500/10 to-emerald-600/10',
          borderColor: 'border-green-400/30',
          iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600'
        };
      case 2: // GuildInviteRejected
        return {
          title: 'Invite Declined',
          color: 'from-red-500 to-rose-600',
          bgColor: 'from-red-500/10 to-rose-600/10',
          borderColor: 'border-red-400/30',
          iconBg: 'bg-gradient-to-br from-red-500 to-rose-600'
        };
      case 3: // TournamentInvite
        return {
          title: 'Tournament Invite',
          color: 'from-amber-500 to-orange-600',
          bgColor: 'from-amber-500/10 to-orange-600/10',
          borderColor: 'border-amber-400/30',
          iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600'
        };
      case 4: // TournamentUpdate
        return {
          title: 'Tournament Update',
          color: 'from-indigo-500 to-blue-600',
          bgColor: 'from-indigo-500/10 to-blue-600/10',
          borderColor: 'border-indigo-400/30',
          iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600'
        };
      case 5: // MatchResult
        return {
          title: 'Match Result',
          color: 'from-emerald-500 to-teal-600',
          bgColor: 'from-emerald-500/10 to-teal-600/10',
          borderColor: 'border-emerald-400/30',
          iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600'
        };
      case 6: // SystemMessage
        return {
          title: 'System Message',
          color: 'from-gray-500 to-slate-600',
          bgColor: 'from-gray-500/10 to-slate-600/10',
          borderColor: 'border-gray-400/30',
          iconBg: 'bg-gradient-to-br from-gray-500 to-slate-600'
        };
      case 7: // FriendRequest
        return {
          title: 'Friend Request',
          color: 'from-pink-500 to-rose-600',
          bgColor: 'from-pink-500/10 to-rose-600/10',
          borderColor: 'border-pink-400/30',
          iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600'
        };
      case 8: // AchievementUnlocked
        return {
          title: 'Achievement Unlocked',
          color: 'from-yellow-500 to-amber-600',
          bgColor: 'from-yellow-500/10 to-amber-600/10',
          borderColor: 'border-yellow-400/30',
          iconBg: 'bg-gradient-to-br from-yellow-500 to-amber-600'
        };
      default:
        return {
          title: 'Notification',
          color: 'from-purple-500 to-indigo-600',
          bgColor: 'from-purple-500/10 to-indigo-600/10',
          borderColor: 'border-purple-400/30',
          iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600'
        };
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

  const isGuildInviteNotification = (notification: any) => {
    return notification.type === 0; // NotificationType.GuildInvite
  };

  const getInviteIdFromNotification = (notification: any) => {
    // The invite ID should be in contentId field for guild invite notifications
    return notification.contentId;
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
            className={`${isMobile ? 'max-h-[60vh]' : 'max-h-80'} overflow-y-auto bg-gradient-to-br from-purple-800/50 to-purple-700/50 custom-scrollbar hide-scrollbar`}
            onTouchStart={handlePullToRefresh}
          >
            {isLoading ? (
              <div className={`${isMobile ? 'p-8' : 'p-6'} text-center`}>
                <div className="relative">
                  <div className={`animate-spin rounded-full border-4 border-amber-400/30 mx-auto ${isMobile ? 'h-12 w-12' : 'h-10 w-10'}`}></div>
                  <div className={`animate-spin rounded-full border-4 border-transparent border-t-amber-400 mx-auto ${isMobile ? 'h-12 w-12' : 'h-10 w-10'} absolute top-0`}></div>
                </div>
                <div className={`${isMobile ? 'mt-4' : 'mt-3'}`}>
                  <p className={`${isMobile ? 'text-base font-semibold' : 'text-sm font-medium'} text-amber-300`}>Loading notifications...</p>
                  <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-amber-400/80 mt-1`}>Fetching your latest updates</p>
                </div>
              </div>
            ) : error ? (
              <div className={`${isMobile ? 'p-8' : 'p-6'} text-center`}>
                <div className={`${isMobile ? 'text-5xl mb-4' : 'text-4xl mb-3'} animate-bounce`}>⚠️</div>
                <div className="bg-gradient-to-br from-red-500/10 to-rose-600/10 rounded-xl p-4 border border-red-400/20">
                  <p className={`${isMobile ? 'text-base font-semibold' : 'text-sm font-medium'} text-red-300 mb-2`}>Oops! Something went wrong</p>
                  <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-red-400/80 mb-4`}>{error}</p>
                <button
                  onClick={refreshNotifications}
                    className={`${isMobile ? 'px-6 py-3 text-sm' : 'px-4 py-2 text-xs'} bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all duration-300 touch-manipulation flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl mx-auto`}
                >
                    <span>🔄</span>
                    <span>Try Again</span>
                </button>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className={`${isMobile ? 'p-8' : 'p-6'} text-center`}>
                <div className="relative">
                  <div className={`${isMobile ? 'text-6xl mb-4' : 'text-5xl mb-3'} animate-float-slow`}>📭</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`${isMobile ? 'w-16 h-16' : 'w-12 h-12'} rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 animate-ping`}></div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-xl p-6 border border-amber-400/20">
                  <h3 className={`${isMobile ? 'text-lg font-bold' : 'text-base font-semibold'} text-amber-300 mb-2`}>All caught up! 🎉</h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-amber-400/80 mb-3`}>You have no new notifications at the moment.</p>
                  {isMobile && (
                    <div className="flex items-center justify-center space-x-2 text-xs text-amber-400/60">
                      <span>💡</span>
                      <span>Pull down to refresh</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const typeInfo = getNotificationTypeInfo(notification.type);
                  const isUnread = notification.status === 0;
                  
                  return (
                  <div
                    key={notification.id}
                      className={`notification-item group relative overflow-hidden rounded-xl border-2 touch-manipulation hover:shadow-yellow-400/50 hover:shadow-lg ${
                        isUnread 
                          ? `bg-gradient-to-br ${typeInfo.bgColor} ${typeInfo.borderColor} shadow-lg border-yellow-400` 
                          : 'bg-gradient-to-br from-purple-800/30 to-purple-700/30 border-purple-600/20'
                      }`}
                    >
                      
                      {/* Content */}
                      <div className={`relative ${isMobile ? 'p-3' : 'p-3'}`}>
                        <div className="flex items-start space-x-3">
                          {/* Icon Container */}
                          <div className={`relative flex-shrink-0 ${isMobile ? 'w-12 h-12' : 'w-10 h-10'} rounded-full ${typeInfo.iconBg} flex items-center justify-center shadow-lg border-2 border-white/20`}>
                            <span className={`${isMobile ? 'text-xl' : 'text-lg'} filter drop-shadow-sm`}>
                        {getNotificationIcon(notification.type)}
                            </span>
                            
                            {/* Pulsing Ring for Unread */}
                            {isUnread && (
                              <div className={`absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping opacity-30`}></div>
                            )}
                      </div>

                          {/* Content Area */}
                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                                <h4 className={`${isMobile ? 'text-base' : 'text-sm'} font-bold ${isUnread ? 'text-yellow-300' : 'text-purple-300'} truncate mb-1`}>
                                  {typeInfo.title}
                                </h4>
                                <div className={`flex items-center space-x-2`}>
                                  <span className={`text-xs ${isUnread ? 'text-yellow-400' : 'text-purple-400'} font-medium`}>
                                    {formatDate(notification.create)}
                                  </span>
                                  {isUnread && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-200 border border-yellow-400/40 shadow-sm`}>
                                      ✨ New
                                    </span>
                                  )}
                                  {notification.type === 0 && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-400/30`}>
                                      🏰 Guild
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Status Indicator */}
                              <div className="flex items-center space-x-2">
                         {isUnread && !isGuildInviteNotification(notification) && (
                           <div className={`w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg`}></div>
                         )}
                              </div>
                            </div>

                            {/* Message */}
                            <div className={`${isMobile ? 'text-sm leading-relaxed' : 'text-sm leading-relaxed'} ${isUnread ? 'text-yellow-100' : 'text-purple-100'} mb-2 group-hover:text-white transition-colors duration-200`}>
                              {notification.message && notification.message !== 'string' ? (
                                <p className="mb-2">{notification.message}</p>
                              ) : (
                                <div className="space-y-2">
                                  <p className={`${isUnread ? 'text-yellow-200' : 'text-purple-200'} font-medium`}>
                                    {getNotificationMessage(notification.type, notification)}
                                  </p>
                                  {notification.type === 0 && (
                                    <div className="bg-gradient-to-r from-yellow-500/15 to-amber-500/15 border border-yellow-400/30 rounded-lg p-3 shadow-md">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-base">🎉</span>
                                        <span className="text-yellow-200 font-semibold text-xs">Guild Invitation</span>
                                      </div>
                                      <p className="text-yellow-200 text-xs leading-relaxed">
                                        {(notification as any).guild && (notification as any).guild.name
                                          ? `You've been invited to join the "${(notification as any).guild.name}" guild! Tap below to accept or decline.`
                                          : "You've been invited to join a guild! Tap below to accept or decline."
                                        }
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Guild Invite Action Buttons */}
                            {isGuildInviteNotification(notification) && notification.status === 0 && (
                              <div className={`${isMobile ? 'mt-3' : 'mt-3'} flex flex-col sm:flex-row gap-3`}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const inviteId = getInviteIdFromNotification(notification);
                                    if (inviteId) {
                                      handleGuildInviteResponse(notification.id, inviteId, 2); // InviteStatus.Accepted
                                    }
                                  }}
                                  disabled={respondingToInvite === getInviteIdFromNotification(notification)}
                                  className={`notification-button ${isMobile ? 'px-6 py-3 text-sm' : 'px-5 py-2 text-xs'} bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl transition-all duration-300 touch-manipulation flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:shadow-green-500/30 border-2 border-green-400/40`}
                                >
                                  {respondingToInvite === getInviteIdFromNotification(notification) ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      <span>{isMobile ? 'Accepting...' : 'Accepting...'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-lg">✅</span>
                                      <span>{isMobile ? 'Accept Invite' : 'Accept'}</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const inviteId = getInviteIdFromNotification(notification);
                                    if (inviteId) {
                                      handleGuildInviteResponse(notification.id, inviteId, 3); // InviteStatus.Declined
                                    }
                                  }}
                                  disabled={respondingToInvite === getInviteIdFromNotification(notification)}
                                  className={`notification-button ${isMobile ? 'px-6 py-3 text-sm' : 'px-5 py-2 text-xs'} bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl transition-all duration-300 touch-manipulation flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:shadow-red-500/30 border-2 border-red-400/40`}
                                >
                                  {respondingToInvite === getInviteIdFromNotification(notification) ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      <span>{isMobile ? 'Declining...' : 'Declining...'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-lg">❌</span>
                                      <span>{isMobile ? 'Decline Invite' : 'Decline'}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {/* Read Button for Non-Guild Invites */}
                            {!isGuildInviteNotification(notification) && isUnread && (
                              <div className={`${isMobile ? 'mt-3' : 'mt-2'} flex justify-end`}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                    // Haptic feedback for mobile
                                    if (isMobile && 'vibrate' in navigator) {
                                      navigator.vibrate(25);
                                    }
                                  }}
                                  className={`notification-button ${isMobile ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'} bg-gradient-to-r ${typeInfo.color} hover:opacity-90 text-white font-medium rounded-lg transition-all duration-200 touch-manipulation flex items-center space-x-1 shadow-md hover:shadow-lg`}
                                >
                                  <span>👁️</span>
                                  <span>{isMobile ? 'Mark as Read' : 'Read'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
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
