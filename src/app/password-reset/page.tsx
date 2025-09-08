'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasswordResetPage() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://localhost:7056/Account/PasswordReset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Username: username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.status !== 200) {
        throw new Error(data.error || data.message || 'Password reset failed');
      }

      setSuccess('Password reset email sent! Please check your email for instructions.');
      setTimeout(() => {
        router.push('/');
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 relative overflow-hidden" suppressHydrationWarning>
      {/* Curtain-like background elements */}
      <div className="absolute inset-0">
        {/* Top curtain */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-700/30 to-transparent"></div>
        
        {/* Side curtains */}
        <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-purple-700/40 to-transparent"></div>
        <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-purple-700/40 to-transparent"></div>
        
        {/* Bottom curtain */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-700/30 to-transparent"></div>
        
        {/* Curtain folds effect */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-1/4 w-px h-full bg-purple-600/50"></div>
          <div className="absolute top-0 left-1/2 w-px h-full bg-purple-600/50"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-purple-600/50"></div>
          <div className="absolute top-0 right-1/4 w-px h-full bg-purple-600/50"></div>
        </div>
      </div>

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
        
        {/* Additional curtain decorations */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-amber-600 opacity-70"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-amber-600 opacity-70"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              {/* Key icon for password reset */}
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mb-4 shadow-lg">
                <svg className="w-16 h-16 text-purple-900" fill="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-amber-600 mb-2 tracking-wider">
              Reset Password
            </h1>
            <p className="text-purple-700 text-lg">
              Reclaim Your Access
            </p>
          </div>

          {/* Form */}
          <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-amber-400/30 relative">
            {/* Decorative columns */}
            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full"></div>
            <div className="absolute -right-2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full"></div>
            
            {/* Curtain-like form header */}
            <div className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-t-2xl"></div>
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-b-2xl"></div>
            
            {/* Form header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-amber-400 mb-2">
                Forgot Your Password?
              </h2>
              <p className="text-purple-200 text-sm">
                Enter your username and we'll send you a reset link
              </p>
            </div>

            {/* Success message */}
            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                <p className="text-green-300 text-sm">{success}</p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div>
                <label className="block text-amber-300 text-sm font-medium mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-900 mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  'Send Reset Email'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-purple-600 text-sm">
              © 2024 Board Games Tracker • All rights reserved Biber
            </p>
          </div>
        </div>
      </div>

      {/* Additional curtain decorations */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-60"></div>
    </div>
  );
} 