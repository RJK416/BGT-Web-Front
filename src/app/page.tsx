'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/LoginModal';
import Leaderboard from '@/components/Leaderboard';


export default function HomePage() {
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-25">
        {/* Geometric shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-amber-400 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-amber-400 transform rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-20 h-20 border-2 border-amber-400 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-28 h-28 border-2 border-amber-400 transform rotate-45"></div>
        
        {/* Additional geometric shapes */}
        <div className="absolute top-1/3 left-1/3 w-16 h-16 border-2 border-amber-300 transform rotate-12 rounded-lg"></div>
        <div className="absolute top-2/3 right-1/3 w-12 h-12 border-2 border-amber-500 transform -rotate-12 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 border-2 border-amber-400 transform rotate-45 rounded-lg"></div>
        <div className="absolute top-1/2 right-1/4 w-14 h-14 border-2 border-amber-300 transform -rotate-45 rounded-full"></div>
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-amber-400 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-amber-300 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 right-1/2 w-3 h-3 bg-amber-400 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-1/2 left-1/2 w-2 h-2 bg-amber-300 rounded-full animate-pulse delay-300"></div>
        
        {/* Stars */}
        <div className="absolute inset-0">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Additional smaller stars */}
        <div className="absolute inset-0">
          {[...Array(40)].map((_, i) => (
            <div
              key={`small-${i}`}
              className="absolute w-0.5 h-0.5 bg-cyan-200 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${1.5 + Math.random() * 1.5}s`
              }}
            />
          ))}
        </div>
        
        {/* Stardust particles */}
        <div className="absolute inset-0">
          {[...Array(25)].map((_, i) => (
            <div
              key={`dust-${i}`}
              className="absolute w-0.5 h-0.5 bg-blue-300 rounded-full opacity-40 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Star Clusters */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-cyan-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-32 left-16 w-2 h-2 bg-cyan-200 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-28 left-24 w-3 h-3 bg-cyan-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.8s' }} />
        
        <div className="absolute top-40 right-32 w-3 h-3 bg-blue-300 rounded-full opacity-70 animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-52 right-28 w-2 h-2 bg-blue-200 rounded-full opacity-90 animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-44 right-36 w-4 h-4 bg-blue-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '2.1s' }} />
        
        <div className="absolute bottom-32 left-40 w-2 h-2 bg-purple-300 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.8s' }} />
        <div className="absolute bottom-40 left-36 w-3 h-3 bg-purple-200 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.7s' }} />
        <div className="absolute bottom-36 left-44 w-1 h-1 bg-purple-400 rounded-full opacity-100 animate-pulse" style={{ animationDelay: '1.4s' }} />
        
        {/* Cosmic Dust/Nebula */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-purple-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-radial from-blue-400/8 via-cyan-400/4 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        
        {/* Additional cosmic dust clouds */}
        <div className="absolute top-1/6 right-1/6 w-72 h-72 bg-gradient-radial from-purple-400/6 via-cyan-400/3 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '3s' }} />
        <div className="absolute bottom-1/6 left-1/6 w-56 h-56 bg-gradient-radial from-blue-300/5 via-purple-300/2 to-transparent rounded-full blur-xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '1.5s' }} />
        <div className="absolute top-2/3 right-1/3 w-48 h-48 bg-gradient-radial from-cyan-300/4 via-blue-300/2 to-transparent rounded-full blur-lg animate-pulse" style={{ animationDuration: '6s', animationDelay: '4s' }} />
        
        {/* Stardust trails */}
        <div className="absolute top-1/3 right-1/4 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent rounded-full blur-sm animate-pulse" style={{ animationDuration: '3s', animationDelay: '2s' }} />
        <div className="absolute bottom-1/3 left-1/4 w-24 h-1 bg-gradient-to-r from-transparent via-purple-300/30 to-transparent rounded-full blur-sm animate-pulse" style={{ animationDuration: '4s', animationDelay: '3.5s' }} />
        <div className="absolute top-1/2 left-1/6 w-28 h-1 bg-gradient-to-r from-transparent via-blue-300/25 to-transparent rounded-full blur-sm animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        
        {/* Shooting Stars */}
        <div className="absolute top-20 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '2.5s' }} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-cyan-300 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '4s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-blue-300 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1.5s' }} />
        
        {/* Orion Constellation */}
        <div className="absolute top-1/4 right-1/4 opacity-60">
          {/* Orion's Belt */}
          <div className="absolute w-2 h-2 bg-white rounded-full top-0 left-0"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full top-0 left-6"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full top-0 left-12"></div>
          {/* Orion's Shoulders */}
          <div className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full top-2 left-2"></div>
          <div className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full top-2 left-10"></div>
          {/* Orion's Sword */}
          <div className="absolute w-1 h-1 bg-cyan-300 rounded-full top-4 left-6"></div>
          <div className="absolute w-1 h-1 bg-cyan-300 rounded-full top-6 left-6"></div>
          {/* Connecting lines */}
          <div className="absolute w-6 h-px bg-blue-400/30 top-1 left-0"></div>
          <div className="absolute w-6 h-px bg-blue-400/30 top-1 left-6"></div>
          <div className="absolute w-8 h-px bg-blue-400/30 top-2 left-2 rotate-12"></div>
          <div className="absolute w-8 h-px bg-blue-400/30 top-2 left-2 -rotate-12"></div>
        </div>
        
        {/* Ursa Major (Big Dipper) */}
        <div className="absolute bottom-1/4 left-1/4 opacity-60">
          {/* Dipper bowl */}
          <div className="absolute w-2 h-2 bg-white rounded-full top-0 left-0"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full top-0 left-4"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full top-4 left-0"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full top-4 left-4"></div>
          {/* Dipper handle */}
          <div className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full top-2 left-8"></div>
          <div className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full top-4 left-12"></div>
          <div className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full top-6 left-16"></div>
          {/* Connecting lines */}
          <div className="absolute w-4 h-px bg-blue-400/30 top-1 left-0"></div>
          <div className="absolute w-4 h-px bg-blue-400/30 top-5 left-0"></div>
          <div className="absolute w-8 h-px bg-blue-400/30 top-2 left-8 rotate-12"></div>
          <div className="absolute w-8 h-px bg-blue-400/30 top-4 left-12 rotate-12"></div>
        </div>
        
        {/* Cassiopeia (W-shaped constellation) */}
        <div className="absolute top-1/2 left-1/6 opacity-60">
          <div className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full top-0 left-0"></div>
          <div className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full top-2 left-4"></div>
          <div className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full top-4 left-8"></div>
          <div className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full top-2 left-12"></div>
          <div className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full top-0 left-16"></div>
          {/* Connecting lines */}
          <div className="absolute w-4 h-px bg-purple-400/30 top-1 left-0"></div>
          <div className="absolute w-4 h-px bg-purple-400/30 top-3 left-4"></div>
          <div className="absolute w-4 h-px bg-purple-400/30 top-5 left-8"></div>
          <div className="absolute w-4 h-px bg-purple-400/30 top-3 left-12"></div>
        </div>
        
        {/* Leo Constellation */}
        <div className="absolute top-1/6 left-1/2 opacity-60">
          {/* Lion's head */}
          <div className="absolute w-2 h-2 bg-amber-300 rounded-full top-0 left-0"></div>
          <div className="absolute w-1.5 h-1.5 bg-amber-300 rounded-full top-2 left-4"></div>
          <div className="absolute w-1.5 h-1.5 bg-amber-300 rounded-full top-4 left-8"></div>
          {/* Lion's body */}
          <div className="absolute w-2 h-2 bg-amber-300 rounded-full top-6 left-12"></div>
          <div className="absolute w-2 h-2 bg-amber-300 rounded-full top-4 left-16"></div>
          {/* Connecting lines */}
          <div className="absolute w-4 h-px bg-amber-400/30 top-1 left-0"></div>
          <div className="absolute w-4 h-px bg-amber-400/30 top-3 left-4"></div>
          <div className="absolute w-4 h-px bg-amber-400/30 top-5 left-8"></div>
          <div className="absolute w-4 h-px bg-amber-400/30 top-7 left-12"></div>
        </div>
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
        <div className="text-center mb-8 relative">
          <h1 className="text-6xl font-bold text-amber-600 mb-4 tracking-wider">
            LEADERBOARD
          </h1>
          <p className="text-purple-200 text-xl">
            Top Players & Guilds
          </p>
          
          {/* Cat Constellation - positioned to the right middle of the title area */}
          <div className="absolute top-1/2 -right-32 transform -translate-y-1/2 opacity-60">
            {/* Cat's head */}
            <div className="absolute w-2 h-2 bg-amber-300 rounded-full top-0 left-8"></div>
            <div className="absolute w-1.5 h-1.5 bg-amber-300 rounded-full top-2 left-4"></div>
            <div className="absolute w-1.5 h-1.5 bg-amber-300 rounded-full top-2 left-12"></div>
            {/* Cat's ears */}
            <div className="absolute w-1 h-1 bg-amber-400 rounded-full top-0 left-6"></div>
            <div className="absolute w-1 h-1 bg-amber-400 rounded-full top-0 left-10"></div>
            {/* Cat's body */}
            <div className="absolute w-2 h-2 bg-amber-300 rounded-full top-6 left-6"></div>
            <div className="absolute w-2 h-2 bg-amber-300 rounded-full top-8 left-8"></div>
            <div className="absolute w-1.5 h-1.5 bg-amber-300 rounded-full top-10 left-10"></div>
            {/* Cat's tail */}
            <div className="absolute w-1 h-1 bg-amber-300 rounded-full top-8 left-2"></div>
            <div className="absolute w-1 h-1 bg-amber-300 rounded-full top-10 left-0"></div>
            <div className="absolute w-1 h-1 bg-amber-300 rounded-full top-12 left-2"></div>
            {/* Cat's legs */}
            <div className="absolute w-1 h-1 bg-amber-300 rounded-full top-12 left-4"></div>
            <div className="absolute w-1 h-1 bg-amber-300 rounded-full top-12 left-8"></div>
            
            {/* Connecting lines to form the cat shape */}
            <div className="absolute w-4 h-px bg-amber-400/30 top-1 left-4"></div>
            <div className="absolute w-4 h-px bg-amber-400/30 top-1 left-8"></div>
            <div className="absolute w-2 h-px bg-amber-400/30 top-3 left-6"></div>
            <div className="absolute w-2 h-px bg-amber-400/30 top-7 left-6"></div>
            <div className="absolute w-2 h-px bg-amber-400/30 top-9 left-8"></div>
            <div className="absolute w-2 h-px bg-amber-400/30 top-9 left-10"></div>
            <div className="absolute w-2 h-px bg-amber-400/30 top-9 left-2"></div>
            <div className="absolute w-2 h-px bg-amber-400/30 top-11 left-0"></div>
            <div className="absolute w-2 h-px bg-amber-400/30 top-13 left-2"></div>
            <div className="absolute w-2 h-px bg-amber-400/30 top-13 left-4"></div>
            <div className="absolute w-2 h-px bg-amber-400/30 top-13 left-8"></div>
          </div>
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