'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/LoginModal';
import Leaderboard from '@/components/Leaderboard';


export default function HomePage() {
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-25">
        {/* Medieval patterns */}
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-amber-400 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-amber-400 transform rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-20 h-20 border-2 border-amber-400 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-28 h-28 border-2 border-amber-400 transform rotate-45"></div>
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-amber-400 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-amber-300 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="flex justify-between items-center mb-8">
          {/* Login/Registration Button */}
          <button
            onClick={() => setShowLogin(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Login / Register
          </button>

          {/* Empty space for balance */}
          <div></div>
        </div>

        {/* Main Title */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-amber-600 mb-4 tracking-wider">
            LEADERBOARD
          </h1>
          <p className="text-purple-200 text-xl">
            Top Players & Guilds
          </p>
        </div>

        {/* Leaderboard */}
        <div className="max-w-4xl mx-auto">
          <Leaderboard 
            limit={5} 
            showTitle={true} 
            showPagination={false}
            showSearch={true}
            className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-amber-400/30"
          />
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            {/* Close button */}
            <button
              onClick={() => setShowLogin(false)}
              className="absolute -top-4 -right-4 z-10 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>
            {/* Login form frame only */}
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-amber-400/30 relative">
              {/* Decorative columns */}
              <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full"></div>
              <div className="absolute -right-2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full"></div>
              
              {/* Curtain-like form header */}
              <div className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-t-2xl"></div>
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-b-2xl"></div>
              
              {/* LoginModal component without background */}
              <div className="relative z-10">
                <LoginModal />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 