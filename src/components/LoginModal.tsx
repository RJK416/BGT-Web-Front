'use client';

import { useState } from 'react';
import { setAuthToken } from '@/utils/auth';
import { API_CONFIG, apiRequest } from '@/config/api';
import { tavernPalette } from '@/styles/tavernTheme';

export default function LoginModal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const validateConfirmPassword = (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError(null);
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword.length > 0) {
      validatePassword(newPassword);
    } else {
      setPasswordError(null);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    if (newConfirmPassword.length > 0) {
      validateConfirmPassword(password, newConfirmPassword);
    } else {
      setConfirmPasswordError(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const requestBody = {
        Username: username,
        Password: password
      };

      const data = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNT.LOGIN}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (!data.ok || data.status !== 200) {
        throw new Error(data.error || data.message || 'Login failed');
      }

      const jwtToken = data.data || data.token || data.jwt;
      if (jwtToken) {
        setAuthToken(jwtToken, rememberMe);
      }

      setSuccess(data.message || 'Login successful!');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError(`Cannot connect to server. Please start your backend API on ${API_CONFIG.BASE_URL}`);
      } else {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email) {
      setError('Please enter both username and email');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }
    
    if (email.length < 3) {
      setError('Email must be at least 3 characters long');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const requestBody = {
        username: username,
        mail: email,
        Purpose: 1, // Registration
        TtlMinutes: 5,
        Identifier: username
      };

      const data = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNT.REGISTER}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (!data.ok || data.status !== 200) {
        throw new Error(data.error || data.message || 'Failed to send OTP');
      }

      setSessionId(data.data);
      setSuccess('OTP sent! Please check your email.');
      setShowOtpInput(true);
      
    } catch (err) {
      console.error('Registration error:', err);
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError(`Cannot connect to server. Please start your backend API on ${API_CONFIG.BASE_URL}`);
      } else {
        setError(err instanceof Error ? err.message : 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const requestBody = {
        sessionId: sessionId,
        otp: otp,
        purpose: 1 // Registration
      };

      const data = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNT.VERIFY_OTP}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (!data.ok || data.status !== 200) {
        throw new Error(data.error || data.message || 'Invalid OTP');
      }

      setSessionId(data.data);
      setSuccess('OTP verified! Please enter your password.');
      setShowOtpInput(false);
      setShowPasswordInput(true);
      setOtp(''); // Clear the OTP field
      
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword(password)) return;
    if (!validateConfirmPassword(password, confirmPassword)) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const requestBody = {
        resetToken: sessionId,
        newPassword: password,
        confirmNewPassword: confirmPassword
      };

      const data = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNT.COMPLETE_REGISTRATION}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (!data.ok || data.status !== 200) {
        throw new Error(data.error || data.message || 'Account creation failed');
      }

      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        setIsRegistering(false);
        setShowOtpInput(false);
        setShowPasswordInput(false);
        setSessionId(null);
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setOtp('');
      }, 2000);
      
    } catch (err) {
      console.error('Account creation error:', err);
      setError(err instanceof Error ? err.message : 'Account creation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 tracking-wider" style={{ 
          color: tavernPalette.gold, 
          fontFamily: 'var(--font-medieval), "Cinzel", "Times New Roman", serif',
          letterSpacing: '0.08em'
        }}>
          Enter the Realm
        </h1>
        <p className="text-lg" style={{ color: tavernPalette.ash }}>
          {isRegistering ? 'Join the adventure' : 'Sign in to track your board game collection'}
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

      {/* Login Form */}
      {!isRegistering && !showOtpInput && !showPasswordInput && (
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: tavernPalette.ash }}>
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: tavernPalette.gold }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg transition-all"
                style={{
                  background: 'rgba(28, 18, 12, 0.98)',
                  border: `1px solid ${tavernPalette.border}`,
                  color: tavernPalette.parchment,
                  outline: 'none'
                }}
                placeholder="Enter username"
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
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: tavernPalette.gold }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg transition-all"
                style={{
                  background: 'rgba(28, 18, 12, 0.98)',
                  border: `1px solid ${tavernPalette.border}`,
                  color: tavernPalette.parchment,
                  outline: 'none'
                }}
                placeholder="Enter password"
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

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded"
                style={{
                  accentColor: tavernPalette.gold,
                  borderColor: tavernPalette.border
                }}
              />
              <span className="ml-2 text-sm" style={{ color: tavernPalette.ash }}>Remember me</span>
            </label>
            <a 
              href="/password-reset" 
              className="text-sm font-medium transition-colors"
              style={{ color: tavernPalette.gold }}
              onMouseEnter={(e) => e.currentTarget.style.color = tavernPalette.goldLight}
              onMouseLeave={(e) => e.currentTarget.style.color = tavernPalette.gold}
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                Signing in...
              </div>
            ) : (
              'Enter the Realm'
            )}
          </button>

          <div className="text-center">
            <span className="text-sm" style={{ color: tavernPalette.ash }}>New to the realm? </span>
            <button
              type="button"
              onClick={() => setIsRegistering(true)}
              className="font-medium transition-colors"
              style={{ color: tavernPalette.gold }}
              onMouseEnter={(e) => e.currentTarget.style.color = tavernPalette.goldLight}
              onMouseLeave={(e) => e.currentTarget.style.color = tavernPalette.gold}
            >
              Create an account
            </button>
          </div>
        </form>
      )}

      {/* Registration Form - Step 1: Username and Email */}
      {isRegistering && !showOtpInput && !showPasswordInput && (
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: tavernPalette.ash }}>
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: tavernPalette.gold }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg transition-all"
                style={{
                  background: 'rgba(28, 18, 12, 0.98)',
                  border: `1px solid ${tavernPalette.border}`,
                  color: tavernPalette.parchment,
                  outline: 'none'
                }}
                placeholder="Enter username"
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
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: tavernPalette.gold }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg transition-all"
                style={{
                  background: 'rgba(28, 18, 12, 0.98)',
                  border: `1px solid ${tavernPalette.border}`,
                  color: tavernPalette.parchment,
                  outline: 'none'
                }}
                placeholder="Enter email"
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
            className="w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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

          <div className="text-center">
            <span className="text-sm" style={{ color: tavernPalette.ash }}>Already have an account? </span>
            <button
              type="button"
              onClick={() => setIsRegistering(false)}
              className="font-medium transition-colors"
              style={{ color: tavernPalette.gold }}
              onMouseEnter={(e) => e.currentTarget.style.color = tavernPalette.goldLight}
              onMouseLeave={(e) => e.currentTarget.style.color = tavernPalette.gold}
            >
              Sign in
            </button>
          </div>
        </form>
      )}

      {/* OTP Verification Form - Step 2 */}
      {showOtpInput && (
        <form onSubmit={handleOtpVerification} className="space-y-6">
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
            className="w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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

      {/* Password Setup Form - Step 3 */}
      {showPasswordInput && (
        <form onSubmit={handlePasswordCompletion} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: tavernPalette.ash }}>
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: tavernPalette.gold }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                className="w-full pl-10 pr-4 py-3 rounded-lg transition-all"
                style={{
                  background: 'rgba(28, 18, 12, 0.98)',
                  border: `1px solid ${passwordError ? '#e8a8a8' : tavernPalette.border}`,
                  color: tavernPalette.parchment,
                  outline: 'none'
                }}
                placeholder="Enter password"
                required
                onFocus={(e) => {
                  e.target.style.borderColor = passwordError ? '#e8a8a8' : tavernPalette.gold;
                  e.target.style.boxShadow = `0 0 0 2px ${passwordError ? '#e8a8a840' : tavernPalette.gold + '40'}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = passwordError ? '#e8a8a8' : tavernPalette.border;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            {passwordError && <p className="text-sm mt-1" style={{ color: '#e8a8a8' }}>{passwordError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: tavernPalette.ash }}>
              Confirm Password
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
                onChange={handleConfirmPasswordChange}
                className="w-full pl-10 pr-4 py-3 rounded-lg transition-all"
                style={{
                  background: 'rgba(28, 18, 12, 0.98)',
                  border: `1px solid ${confirmPasswordError ? '#e8a8a8' : tavernPalette.border}`,
                  color: tavernPalette.parchment,
                  outline: 'none'
                }}
                placeholder="Confirm password"
                required
                onFocus={(e) => {
                  e.target.style.borderColor = confirmPasswordError ? '#e8a8a8' : tavernPalette.gold;
                  e.target.style.boxShadow = `0 0 0 2px ${confirmPasswordError ? '#e8a8a840' : tavernPalette.gold + '40'}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = confirmPasswordError ? '#e8a8a8' : tavernPalette.border;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            {confirmPasswordError && <p className="text-sm mt-1" style={{ color: '#e8a8a8' }}>{confirmPasswordError}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                Creating...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
