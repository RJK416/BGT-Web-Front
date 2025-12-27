'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { guildService } from '../services/guildService';
import type { Notification } from '../types/notification';
import type { InviteStatus } from '../types/guild';

interface GuildInviteModalProps {
  notification: Notification;
  isOpen: boolean;
  onClose: () => void;
  onResponse: () => void;
  isMobile: boolean;
}

const GuildInviteModal: React.FC<GuildInviteModalProps> = ({
  notification,
  isOpen,
  onClose,
  onResponse,
  isMobile
}) => {
  const [isResponding, setIsResponding] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [responseStatus, setResponseStatus] = useState<'accepted' | 'declined' | null>(null);

  const handleResponse = async (status: InviteStatus) => {
    if (isResponding || hasResponded) return;

    try {
      setIsResponding(true);
      
      // Haptic feedback for mobile
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }

      const requestData = {
        inviteId: notification.contentId!,
        status,
        dateTime: new Date().toISOString()
      };
      
      console.log('Sending guild invite response:', requestData);
      
      const response = await guildService.respondToInvitation(requestData);
      
      console.log('Guild invite response received:', response);

      if (response.status === 200) {
        setHasResponded(true);
        setResponseStatus(status === 2 ? 'accepted' : 'declined');
        
        console.log('Guild invite response successful:', {
          inviteId: notification.contentId,
          status: status === 2 ? 'accepted' : 'declined',
          response: response
        });
        
        // Success feedback
        if (isMobile && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }

        // Call the parent callback to mark as read
        console.log('Calling onResponse to mark notification as read');
        onResponse();

        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
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
      setIsResponding(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
      <div className={`
        ${isMobile ? 'w-full max-w-sm' : 'w-full max-w-md'} 
        bg-gradient-to-br from-purple-950 to-purple-900 
        rounded-2xl shadow-2xl border-2 border-amber-400/30 
        overflow-hidden transform transition-all duration-300
        ${isMobile ? 'mx-4' : ''}
      `}>
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-b-2 border-amber-400/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg border-2 border-amber-400/50">
                <span className="text-2xl">🏰</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-amber-300">
                  {notification.senderName ? `${notification.senderName} has invited you` : 'Guild Invitation'}
                </h2>
                <p className="text-sm text-amber-400">
                  {notification.guild?.name 
                    ? `To join ${notification.guild.name}` 
                    : "You've been invited to join a guild!"
                  }
                </p>
              </div>
            </div>
            {!hasResponded && (
              <button
                onClick={onClose}
                className="p-2 text-amber-400 hover:text-amber-300 transition-colors rounded-full hover:bg-amber-500/10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!hasResponded ? (
            <>
              {/* Guild Info */}
              <div className="mb-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-xl p-4 border border-blue-400/20">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">🎉</span>
                    <span className="text-lg font-semibold text-blue-300">Invitation Details</span>
                  </div>
                  <p className="text-blue-200 text-sm leading-relaxed">
                    <span className="font-semibold text-amber-300">{notification.senderName || 'Someone'}</span> has invited you to join <span className="font-semibold text-amber-300">
                      {notification.guild?.name || 'a guild'}
                    </span>! 
                    This is an exciting opportunity to join a community of fellow board game enthusiasts.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleResponse(2)} // InviteStatus.Accepted
                  disabled={isResponding}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl hover:shadow-green-500/30 border-2 border-green-400/40 disabled:border-gray-500/40"
                >
                  {isResponding ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Accepting...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">✅</span>
                      <span className="text-lg">Accept Invitation</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleResponse(3)} // InviteStatus.Declined
                  disabled={isResponding}
                  className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl hover:shadow-red-500/30 border-2 border-red-400/40 disabled:border-gray-500/40"
                >
                  {isResponding ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Declining...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">❌</span>
                      <span className="text-lg">Decline Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Response Confirmation */
            <div className="text-center py-8">
              <div className="mb-6">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg border-4 ${
                  responseStatus === 'accepted' 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400/50' 
                    : 'bg-gradient-to-br from-red-500 to-rose-600 border-red-400/50'
                }`}>
                  <span className="text-4xl">
                    {responseStatus === 'accepted' ? '✅' : '❌'}
                  </span>
                </div>
              </div>
              
              <h3 className={`text-2xl font-bold mb-2 ${
                responseStatus === 'accepted' ? 'text-green-300' : 'text-red-300'
              }`}>
                {responseStatus === 'accepted' ? 'Invitation Accepted!' : 'Invitation Declined'}
              </h3>
              
              <p className={`text-lg ${
                responseStatus === 'accepted' ? 'text-green-200' : 'text-red-200'
              }`}>
                {responseStatus === 'accepted' 
                  ? `Welcome to ${notification.guild?.name || 'the guild'}! You will be notified of your new membership.`
                  : `The invitation from ${notification.guild?.name || 'the guild'} has been declined. No further action required.`
                }
              </p>

              <div className="mt-6">
                <div className="animate-pulse text-sm text-amber-400">
                  Closing automatically...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GuildInviteModal;
