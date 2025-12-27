'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getUserFromToken } from '@/utils/auth';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

interface GuildChatProps {
  guildId: number;
  guildName: string;
  onClose: () => void;
}

export default function GuildChat({ guildId, guildName, onClose }: GuildChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = getUserFromToken();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      // Use a simple WebSocket server - you can use any WebSocket service
      // For demo purposes, I'll use a mock connection that works locally
      // In production, you'd connect to your actual WebSocket server
      
      const wsUrl = `wss://echo.websocket.org`; // Free echo server for demo
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Chat connected');
        setIsConnected(true);
        
        // Join the guild chat room
        const joinMessage = {
          type: 'join',
          guildId: guildId,
          username: (user as any)?.name || (user as any)?.unique_name || 'Anonymous',
          timestamp: new Date().toISOString()
        };
        
        wsRef.current?.send(JSON.stringify(joinMessage));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            const chatMessage: ChatMessage = {
              id: data.id || Date.now().toString(),
              username: data.username,
              message: data.message,
              timestamp: new Date(data.timestamp),
              isOwn: data.username === ((user as any)?.name || (user as any)?.unique_name || 'Anonymous')
            };
            
            setMessages(prev => [...prev, chatMessage]);
          } else if (data.type === 'user_joined') {
            setUsers(prev => new Set([...prev, data.username]));
            // Add system message
            const systemMessage: ChatMessage = {
              id: `system-${Date.now()}`,
              username: 'System',
              message: `${data.username} joined the chat`,
              timestamp: new Date(),
              isOwn: false
            };
            setMessages(prev => [...prev, systemMessage]);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Chat disconnected');
        setIsConnected(false);
        // Try to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [guildId, user]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !wsRef.current || !isConnected) return;

    const messageData = {
      type: 'message',
      guildId: guildId,
      username: (user as any)?.name || (user as any)?.unique_name || 'Anonymous',
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    wsRef.current.send(JSON.stringify(messageData));
    setNewMessage('');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-purple-950/95 to-purple-900/95 rounded-xl border-2 border-amber-400/30 w-full max-w-2xl mx-4 h-[600px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-800/50 to-purple-700/50 border-b border-amber-400/30 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-emerald-100 text-lg">💬</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-400">{guildName} Chat</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm text-purple-300">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                <span className="text-sm text-purple-400">• {users.size} online</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white text-2xl px-2"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-purple-900/20 to-purple-800/20">
          {messages.length === 0 ? (
            <div className="text-center text-purple-400 py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.isOwn
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                      : msg.username === 'System'
                      ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-400/30'
                      : 'bg-gradient-to-r from-purple-700/50 to-purple-600/50 text-purple-100'
                  }`}
                >
                  {msg.username !== 'System' && !msg.isOwn && (
                    <div className="text-xs text-purple-300 mb-1 font-medium">
                      {msg.username}
                    </div>
                  )}
                  <div className="text-sm">{msg.message}</div>
                  <div className={`text-xs mt-1 ${
                    msg.isOwn ? 'text-emerald-100' : 'text-purple-400'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-amber-400/30">
          <form onSubmit={sendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-purple-800/50 border border-amber-400/30 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !isConnected}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg transition-all duration-300"
            >
              Send
            </button>
          </form>
          <div className="text-xs text-purple-400 mt-2 text-center">
            Messages are temporary and will be lost on refresh
          </div>
        </div>
      </div>
    </div>
  );
}
