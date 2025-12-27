'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/LoginModal';
import Leaderboard from '@/components/Leaderboard';
import { isAuthenticated } from '@/utils/auth';
import { tavernPalette } from '@/styles/tavernTheme';


export default function HomePage() {
  const [showLogin, setShowLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated()) {
      // Redirect to dashboard if authenticated
      router.push('/dashboard');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-orange-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-green-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-25 hidden sm:block">
        {/* Geometric shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-orange-500 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-orange-500 transform rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-20 h-20 border-2 border-orange-500 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-28 h-28 border-2 border-orange-500 transform rotate-45"></div>
        
        {/* Additional geometric shapes */}
        <div className="absolute top-1/3 left-1/3 w-12 h-12 sm:w-16 sm:h-16 border-2 border-orange-400 transform rotate-12 rounded-lg"></div>
        <div className="absolute top-2/3 right-1/3 w-12 h-12 border-2 border-orange-600 transform -rotate-12 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 border-2 border-orange-500 transform rotate-45 rounded-lg"></div>
        <div className="absolute top-1/2 right-1/4 w-10 h-10 sm:w-14 sm:h-14 border-2 border-orange-400 transform -rotate-45 rounded-full"></div>
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 sm:w-4 sm:h-4 bg-orange-500 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-orange-400 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-orange-600 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 right-1/2 w-3 h-3 bg-orange-500 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-1/2 left-1/2 w-2 h-2 bg-orange-400 rounded-full animate-pulse delay-300"></div>
        
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
              className="absolute w-0.5 h-0.5 bg-orange-300 rounded-full animate-pulse"
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
              className="absolute w-0.5 h-0.5 bg-emerald-300 rounded-full opacity-40 animate-pulse"
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
        <div className="absolute top-20 left-20 w-4 h-4 bg-orange-400 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-32 left-16 w-2 h-2 bg-orange-300 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-28 left-24 w-3 h-3 bg-orange-500 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.8s' }} />
        
        <div className="absolute top-40 right-32 w-3 h-3 bg-emerald-400 rounded-full opacity-70 animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-52 right-28 w-2 h-2 bg-emerald-300 rounded-full opacity-90 animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-44 right-36 w-4 h-4 bg-emerald-500 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '2.1s' }} />
        
        <div className="absolute bottom-32 left-40 w-2 h-2 bg-orange-400 rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.8s' }} />
        <div className="absolute bottom-40 left-36 w-3 h-3 bg-orange-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.7s' }} />
        <div className="absolute bottom-36 left-44 w-1 h-1 bg-orange-500 rounded-full opacity-100 animate-pulse" style={{ animationDelay: '1.4s' }} />
        
        {/* Cosmic Dust/Nebula */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-orange-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-orange-600/10 via-emerald-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 sm:w-64 sm:h-64 bg-gradient-radial from-emerald-400/8 via-green-400/4 to-transparent rounded-full blur-xl sm:blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        
        {/* Additional cosmic dust clouds */}
        <div className="absolute top-1/6 right-1/6 w-72 h-72 bg-gradient-radial from-orange-400/6 via-emerald-400/3 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '3s' }} />
        <div className="absolute bottom-1/6 left-1/6 w-56 h-56 bg-gradient-radial from-emerald-300/5 via-green-300/2 to-transparent rounded-full blur-xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '1.5s' }} />
        <div className="absolute top-2/3 right-1/3 w-48 h-48 bg-gradient-radial from-orange-300/4 via-emerald-300/2 to-transparent rounded-full blur-lg animate-pulse" style={{ animationDuration: '6s', animationDelay: '4s' }} />
        
        {/* Stardust trails */}
        <div className="absolute top-1/3 right-1/4 w-32 h-1 bg-gradient-to-r from-transparent via-orange-400/30 to-transparent rounded-full blur-sm animate-pulse" style={{ animationDuration: '3s', animationDelay: '2s' }} />
        <div className="absolute bottom-1/3 left-1/4 w-24 h-1 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent rounded-full blur-sm animate-pulse" style={{ animationDuration: '4s', animationDelay: '3.5s' }} />
        <div className="absolute top-1/2 left-1/6 w-28 h-1 bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent rounded-full blur-sm animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        
        {/* Shooting Stars */}
        <div className="absolute top-20 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '2.5s' }} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-orange-400 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '4s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-emerald-400 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1.5s' }} />
        
        {/* Orion Constellation */}
        <div className="absolute top-1/4 right-1/4 opacity-60">
          {/* Orion's Belt */}
          <div className="absolute w-2 h-2 bg-white rounded-full top-0 left-0"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full top-0 left-6"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full top-0 left-12"></div>
          {/* Orion's Shoulders */}
          <div className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full top-2 left-2"></div>
          <div className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full top-2 left-10"></div>
          {/* Orion's Sword */}
          <div className="absolute w-1 h-1 bg-orange-400 rounded-full top-4 left-6"></div>
          <div className="absolute w-1 h-1 bg-orange-400 rounded-full top-6 left-6"></div>
          {/* Connecting lines */}
          <div className="absolute w-6 h-px bg-emerald-500/30 top-1 left-0"></div>
          <div className="absolute w-6 h-px bg-emerald-500/30 top-1 left-6"></div>
          <div className="absolute w-8 h-px bg-emerald-500/30 top-2 left-2 rotate-12"></div>
          <div className="absolute w-8 h-px bg-emerald-500/30 top-2 left-2 -rotate-12"></div>
        </div>
        
        {/* Ursa Major (Big Dipper) */}
        <div className="absolute bottom-1/4 left-1/4 opacity-60">
          {/* Dipper bowl */}
          <div className="absolute w-2 h-2 bg-white rounded-full top-0 left-0"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full top-0 left-4"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full top-4 left-0"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full top-4 left-4"></div>
          {/* Dipper handle */}
          <div className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full top-2 left-8"></div>
          <div className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full top-4 left-12"></div>
          <div className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full top-6 left-16"></div>
          {/* Connecting lines */}
          <div className="absolute w-4 h-px bg-emerald-500/30 top-1 left-0"></div>
          <div className="absolute w-4 h-px bg-emerald-500/30 top-5 left-0"></div>
          <div className="absolute w-8 h-px bg-emerald-500/30 top-2 left-8 rotate-12"></div>
          <div className="absolute w-8 h-px bg-emerald-500/30 top-4 left-12 rotate-12"></div>
        </div>
        
        {/* Cassiopeia (W-shaped constellation) */}
        <div className="absolute top-1/2 left-1/6 opacity-60">
          <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full top-0 left-0"></div>
          <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full top-2 left-4"></div>
          <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full top-4 left-8"></div>
          <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full top-2 left-12"></div>
          <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full top-0 left-16"></div>
          {/* Connecting lines */}
          <div className="absolute w-4 h-px bg-orange-500/30 top-1 left-0"></div>
          <div className="absolute w-4 h-px bg-orange-500/30 top-3 left-4"></div>
          <div className="absolute w-4 h-px bg-orange-500/30 top-5 left-8"></div>
          <div className="absolute w-4 h-px bg-orange-500/30 top-3 left-12"></div>
        </div>
        
        {/* Leo Constellation */}
        <div className="absolute top-1/6 left-1/2 opacity-60">
          {/* Lion's head */}
          <div className="absolute w-2 h-2 bg-orange-400 rounded-full top-0 left-0"></div>
          <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full top-2 left-4"></div>
          <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full top-4 left-8"></div>
          {/* Lion's body */}
          <div className="absolute w-2 h-2 bg-orange-400 rounded-full top-6 left-12"></div>
          <div className="absolute w-2 h-2 bg-orange-400 rounded-full top-4 left-16"></div>
          {/* Connecting lines */}
          <div className="absolute w-4 h-px bg-orange-500/30 top-1 left-0"></div>
          <div className="absolute w-4 h-px bg-orange-500/30 top-3 left-4"></div>
          <div className="absolute w-4 h-px bg-orange-500/30 top-5 left-8"></div>
          <div className="absolute w-4 h-px bg-orange-500/30 top-7 left-12"></div>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          {/* Login/Registration Button */}
          <button
            onClick={() => setShowLogin(true)}
            className="font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
            style={{
              background: `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`,
              border: `1px solid ${tavernPalette.border}`,
              color: tavernPalette.borderDark,
              boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `linear-gradient(180deg, ${tavernPalette.goldLight} 0%, ${tavernPalette.gold} 100%)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`;
            }}
          >
            Login / Register
          </button>

          {/* Empty space for balance */}
          <div></div>
        </div>

        {/* Main Title */}
        <div className="text-center mb-6 sm:mb-8 relative px-2">
          <h1 className="text-3xl sm:text-6xl font-bold text-orange-500 mb-2 sm:mb-4 tracking-wide sm:tracking-wider">
            LEADERBOARD
          </h1>
          <p className="text-emerald-200 text-sm sm:text-xl">
            Top Players & Guilds
          </p>
          
          {/* Cat Constellation - positioned to the right middle of the title area */}
          <div className="absolute top-1/2 -right-32 transform -translate-y-1/2 opacity-60 hidden md:block">
            {/* Cat's head */}
            <div className="absolute w-2 h-2 bg-orange-400 rounded-full top-0 left-8"></div>
            <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full top-2 left-4"></div>
            <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full top-2 left-12"></div>
            {/* Cat's ears */}
            <div className="absolute w-1 h-1 bg-orange-500 rounded-full top-0 left-6"></div>
            <div className="absolute w-1 h-1 bg-orange-500 rounded-full top-0 left-10"></div>
            {/* Cat's body */}
            <div className="absolute w-2 h-2 bg-orange-400 rounded-full top-6 left-6"></div>
            <div className="absolute w-2 h-2 bg-orange-400 rounded-full top-8 left-8"></div>
            <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full top-10 left-10"></div>
            {/* Cat's tail */}
            <div className="absolute w-1 h-1 bg-orange-400 rounded-full top-8 left-2"></div>
            <div className="absolute w-1 h-1 bg-orange-400 rounded-full top-10 left-0"></div>
            <div className="absolute w-1 h-1 bg-orange-400 rounded-full top-12 left-2"></div>
            {/* Cat's legs */}
            <div className="absolute w-1 h-1 bg-orange-400 rounded-full top-12 left-4"></div>
            <div className="absolute w-1 h-1 bg-orange-400 rounded-full top-12 left-8"></div>
            
            {/* Connecting lines to form the cat shape */}
            <div className="absolute w-4 h-px bg-orange-500/30 top-1 left-4"></div>
            <div className="absolute w-4 h-px bg-orange-500/30 top-1 left-8"></div>
            <div className="absolute w-2 h-px bg-orange-500/30 top-3 left-6"></div>
            <div className="absolute w-2 h-px bg-orange-500/30 top-7 left-6"></div>
            <div className="absolute w-2 h-px bg-orange-500/30 top-9 left-8"></div>
            <div className="absolute w-2 h-px bg-orange-500/30 top-9 left-10"></div>
            <div className="absolute w-2 h-px bg-orange-500/30 top-9 left-2"></div>
            <div className="absolute w-2 h-px bg-orange-500/30 top-11 left-0"></div>
            <div className="absolute w-2 h-px bg-orange-500/30 top-13 left-2"></div>
            <div className="absolute w-2 h-px bg-orange-500/30 top-13 left-4"></div>
            <div className="absolute w-2 h-px bg-orange-500/30 top-13 left-8"></div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="max-w-full sm:max-w-4xl mx-auto px-2 sm:px-0">
          <Leaderboard 
            limit={5} 
            showTitle={true} 
            showPagination={false}
            showSearch={true}
            className="sm:p-8"
          />
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="relative w-full max-w-sm sm:max-w-md">
            {/* Login form frame only */}
            <div className="medieval-panel p-4 sm:p-8 relative overflow-hidden">
              {/* Integrated Close Button - Diamond Shield at Corner */}
              <button
                onClick={() => setShowLogin(false)}
                className="absolute -top-[5px] -right-[330px] sm:-top-[5px] sm:-right-[330px] z-20 group"
                aria-label="Close modal"
              >
                {/* Diamond/Shield shape container */}
                <div 
                  className="relative w-9 h-9 sm:w-11 sm:h-11 rotate-45 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`,
                    borderRadius: '4px',
                    boxShadow: `
                      0 2px 8px rgba(0,0,0,0.5),
                      inset 0 1px 0 rgba(255,255,255,0.3),
                      inset 0 -1px 0 rgba(0,0,0,0.3)
                    `,
                    border: `2px solid ${tavernPalette.border}`
                  }}
                >
                  {/* Inner dark inset */}
                  <div 
                    className="absolute inset-[3px] rounded-[2px]"
                    style={{
                      background: `linear-gradient(180deg, ${tavernPalette.panel} 0%, ${tavernPalette.borderDark} 100%)`,
                      boxShadow: `inset 0 1px 3px rgba(0,0,0,0.5)`
                    }}
                  />
                  
                  {/* Inner gold ring */}
                  <div 
                    className="absolute inset-[5px] rounded-[2px]"
                    style={{
                      border: `1px solid ${tavernPalette.bronze}`,
                      background: 'transparent'
                    }}
                  />
                </div>
                
                {/* X Symbol - Counter-rotated to be straight */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-90">
                    {/* First bar */}
                    <div 
                      className="absolute top-1/2 left-1/2 w-full h-[2.5px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${tavernPalette.bronze} 0%, ${tavernPalette.gold} 50%, ${tavernPalette.bronze} 100%)`,
                        boxShadow: `0 1px 2px rgba(0,0,0,0.4)`
                      }}
                    />
                    {/* Second bar */}
                    <div 
                      className="absolute top-1/2 left-1/2 w-full h-[2.5px] -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${tavernPalette.bronze} 0%, ${tavernPalette.gold} 50%, ${tavernPalette.bronze} 100%)`,
                        boxShadow: `0 1px 2px rgba(0,0,0,0.4)`
                      }}
                    />
                  </div>
                </div>
                
                {/* Hover glow effect */}
                <div 
                  className="absolute inset-0 rotate-45 rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${tavernPalette.gold}40 0%, transparent 70%)`
                  }}
                />
              </button>
              
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