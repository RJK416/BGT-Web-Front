'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_CONFIG, apiRequest } from '@/config/api';
import { tavernPalette } from '@/styles/tavernTheme';

export default function PasswordResetPage() {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Enter identifier, 2: Enter OTP, 3: Enter new password
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNT.REGISTER}`, {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier,
          mail: null,
          username: null,
          purpose: 2, // Password_Reset
          ttlMinutes: 5
        }),
      });

      if (!response.ok) {
        throw new Error(response.error || response.message || 'Failed to send OTP');
      }

      setSessionId(response.data);
      setSuccess('OTP sent! Please check your email.');
      setStep(2);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNT.VERIFY_OTP}`, {
        method: 'POST',
        body: JSON.stringify({
          sessionId: sessionId,
          otp: otp,
          purpose: 2 // Password_Reset
        }),
      });

      if (!response.ok) {
        throw new Error(response.error || response.message || 'Invalid OTP');
      }

      setSessionId(response.data); // Store the JWT token for password reset
      setSuccess('OTP verified! Please enter your new password.');
      setStep(3);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNT.RESET_PASSWORD}`, {
        method: 'PUT',
        body: JSON.stringify({
          resetToken: sessionId, // This is the JWT token from OTP verification
          newPassword: newPassword,
          confirmNewPassword: confirmPassword
        }),
      });

      if (!response.ok) {
        throw new Error(response.error || response.message || 'Password reset failed');
      }

      setSuccess('Password reset successfully! Redirecting to login...');
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
    <div 
      className="min-h-screen relative overflow-hidden" 
      style={{
        minHeight: '100vh',
        backgroundColor: tavernPalette.background,
        backgroundImage: `radial-gradient(circle at top, rgba(15, 35, 29, 0.65), transparent 55%), radial-gradient(circle at bottom, rgba(12, 24, 20, 0.6), transparent 60%)`,
        color: tavernPalette.parchment
      }}
      suppressHydrationWarning
    >

      {/* Main content */}
      <div className="relative z-50 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              {/* Key Icon */}
              <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full mb-4 shadow-2xl border-4 border-amber-300 relative">
                {/* Key glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full blur-sm opacity-50 animate-pulse"></div>
                
                {/* Key shape */}
                <div className="relative z-10 flex items-center justify-center">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: tavernPalette.borderDark }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                
                {/* Floating particles around key */}
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-amber-300 rounded-full animate-pulse"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-300 rounded-full animate-pulse delay-500"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-amber-300 rounded-full animate-pulse delay-1000"></div>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-amber-300 rounded-full animate-pulse delay-1500"></div>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2 tracking-wider" style={{ 
              color: tavernPalette.gold, 
              fontFamily: 'var(--font-medieval), "Cinzel", "Times New Roman", serif',
              letterSpacing: '0.08em'
            }}>
              RESET PASSWORD
            </h1>
            <p className="text-lg" style={{ color: tavernPalette.ash }}>
              Reclaim Your Access
            </p>
          </div>

          {/* Form */}
          <div className="medieval-panel p-8 relative overflow-hidden z-[60]">
            {/* Form header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2" style={{ 
                color: tavernPalette.gold, 
                fontFamily: 'var(--font-medieval), "Cinzel", "Times New Roman", serif',
                letterSpacing: '0.08em'
              }}>
                {step === 1 && "FORGOT YOUR PASSWORD?"}
                {step === 2 && "VERIFY YOUR IDENTITY"}
                {step === 3 && "SET NEW PASSWORD"}
              </h2>
              <p className="text-sm" style={{ color: tavernPalette.ash }}>
                {step === 1 && "Enter your username or email to receive a verification code"}
                {step === 2 && "Enter the 6-digit code sent to your email"}
                {step === 3 && "Enter your new password"}
              </p>
            </div>

            {/* Success message */}
            {success && (
              <div className="mb-4 p-4 rounded-lg relative overflow-hidden" style={{
                background: `linear-gradient(135deg, rgba(60, 122, 87, 0.25) 0%, rgba(34, 75, 57, 0.3) 100%)`,
                border: `2px solid rgba(60, 122, 87, 0.6)`,
                boxShadow: `0 0 20px rgba(60, 122, 87, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.2)`
              }}>
                <div className="absolute inset-0 opacity-10" style={{
                  background: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(60, 122, 87, 0.1) 10px, rgba(60, 122, 87, 0.1) 20px)`
                }}></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="flex-shrink-0 flex items-center justify-center" style={{ 
                    fontSize: '1.5rem',
                    width: '32px',
                    height: '32px',
                    background: 'rgba(60, 122, 87, 0.2)',
                    borderRadius: '50%',
                    border: '1px solid rgba(60, 122, 87, 0.4)',
                    fontFamily: 'serif'
                  }}>✦</div>
                  <p className="text-sm font-medium flex-1" style={{ color: '#d7ead3', textTransform: 'none', letterSpacing: '0.02em' }}>{success}</p>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-4 p-4 rounded-lg relative overflow-hidden" style={{
                background: `linear-gradient(135deg, rgba(128, 44, 44, 0.25) 0%, rgba(90, 30, 30, 0.3) 100%)`,
                border: `2px solid rgba(128, 44, 44, 0.6)`,
                boxShadow: `0 0 20px rgba(128, 44, 44, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.2)`
              }}>
                <div className="absolute inset-0 opacity-10" style={{
                  background: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(128, 44, 44, 0.1) 10px, rgba(128, 44, 44, 0.1) 20px)`
                }}></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="flex-shrink-0 flex items-center justify-center" style={{ 
                    fontSize: '1.5rem',
                    width: '32px',
                    height: '32px',
                    background: 'rgba(128, 44, 44, 0.2)',
                    borderRadius: '50%',
                    border: '1px solid rgba(128, 44, 44, 0.4)',
                    fontFamily: 'serif'
                  }}>⚔️</div>
                  <p className="text-sm font-medium flex-1" style={{ color: '#e8a8a8', textTransform: 'none', letterSpacing: '0.02em' }}>{error}</p>
                </div>
              </div>
            )}

            {/* Step 1: Enter identifier */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-6 relative z-[70]">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: tavernPalette.ash }}>
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: tavernPalette.gold }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg transition-all"
                      style={{
                        background: 'rgba(28, 18, 12, 0.98)',
                        border: `1px solid ${tavernPalette.border}`,
                        color: tavernPalette.parchment,
                        outline: 'none'
                      }}
                      placeholder="Enter your username or email"
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = tavernPalette.gold;
                        e.target.style.boxShadow = `0 0 0 2px ${tavernPalette.gold}40`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = tavernPalette.border;
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg relative z-[80]"
                  style={{
                    background: `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`,
                    border: `1px solid ${tavernPalette.border}`,
                    color: tavernPalette.borderDark,
                    boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)`
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = `linear-gradient(180deg, ${tavernPalette.goldLight} 0%, ${tavernPalette.gold} 100%)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`;
                    }
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-2" style={{ borderColor: tavernPalette.borderDark }}></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Enter OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-6 relative z-[70]">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: tavernPalette.ash }}>
                    Verification Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: tavernPalette.gold }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg transition-all text-center text-lg tracking-widest"
                      style={{
                        background: 'rgba(28, 18, 12, 0.98)',
                        border: `1px solid ${tavernPalette.border}`,
                        color: tavernPalette.parchment,
                        outline: 'none'
                      }}
                      placeholder="000000"
                      maxLength={6}
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = tavernPalette.gold;
                        e.target.style.boxShadow = `0 0 0 2px ${tavernPalette.gold}40`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = tavernPalette.border;
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg relative z-[80]"
                  style={{
                    background: `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`,
                    border: `1px solid ${tavernPalette.border}`,
                    color: tavernPalette.borderDark,
                    boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)`
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = `linear-gradient(180deg, ${tavernPalette.goldLight} 0%, ${tavernPalette.gold} 100%)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`;
                    }
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-2" style={{ borderColor: tavernPalette.borderDark }}></div>
                      Verifying...
                    </div>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </form>
            )}

            {/* Step 3: Enter new password */}
            {step === 3 && (
              <form onSubmit={handleCompleteReset} className="space-y-6 relative z-[70]">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: tavernPalette.ash }}>
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: tavernPalette.gold }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg transition-all"
                      style={{
                        background: 'rgba(28, 18, 12, 0.98)',
                        border: `1px solid ${tavernPalette.border}`,
                        color: tavernPalette.parchment,
                        outline: 'none'
                      }}
                      placeholder="Enter new password"
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = tavernPalette.gold;
                        e.target.style.boxShadow = `0 0 0 2px ${tavernPalette.gold}40`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = tavernPalette.border;
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: tavernPalette.ash }}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: tavernPalette.gold }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg transition-all"
                      style={{
                        background: 'rgba(28, 18, 12, 0.98)',
                        border: `1px solid ${tavernPalette.border}`,
                        color: tavernPalette.parchment,
                        outline: 'none'
                      }}
                      placeholder="Confirm new password"
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = tavernPalette.gold;
                        e.target.style.boxShadow = `0 0 0 2px ${tavernPalette.gold}40`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = tavernPalette.border;
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg relative z-[80]"
                  style={{
                    background: `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`,
                    border: `1px solid ${tavernPalette.border}`,
                    color: tavernPalette.borderDark,
                    boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)`
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = `linear-gradient(180deg, ${tavernPalette.goldLight} 0%, ${tavernPalette.gold} 100%)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = `linear-gradient(180deg, ${tavernPalette.gold} 0%, ${tavernPalette.bronze} 100%)`;
                    }
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-2" style={{ borderColor: tavernPalette.borderDark }}></div>
                      Resetting...
                    </div>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            )}

            {/* Back to Login */}
            <div className="text-center mt-6 relative z-[70]">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="font-medium transition-colors"
                style={{ color: tavernPalette.gold }}
                onMouseEnter={(e) => e.currentTarget.style.color = tavernPalette.goldLight}
                onMouseLeave={(e) => e.currentTarget.style.color = tavernPalette.gold}
              >
                Back to Login
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm" style={{ color: tavernPalette.ash }}>
              © 2024 Board Games Tracker • All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
