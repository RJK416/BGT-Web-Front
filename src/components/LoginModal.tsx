'use client';

import { useState } from 'react';
import { setAuthToken } from '@/utils/auth';
import { API_CONFIG, apiRequest } from '@/config/api';

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
        <h1 className="text-4xl font-bold text-amber-600 mb-2 tracking-wider">
          Enter the Realm
        </h1>
        <p className="text-purple-200 text-lg">
          {isRegistering ? 'Join the adventure' : 'Sign in to track your board game collection'}
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

      {/* Login Form */}
      {!isRegistering && !showOtpInput && !showPasswordInput && (
        <form onSubmit={handleLogin} className="space-y-6">
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
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-amber-300 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500" 
              />
              <span className="ml-2 text-purple-200 text-sm">Remember me</span>
            </label>
            <a href="/password-reset" className="text-amber-400 hover:text-amber-300 text-sm font-medium">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-900 mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Enter the Realm'
            )}
          </button>

          <div className="text-center">
            <span className="text-purple-200 text-sm">New to the realm? </span>
            <button
              type="button"
              onClick={() => setIsRegistering(true)}
              className="text-amber-400 hover:text-amber-300 font-medium"
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
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-amber-300 text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                placeholder="Enter email"
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
              'Send Verification Code'
            )}
          </button>

          <div className="text-center">
            <span className="text-purple-200 text-sm">Already have an account? </span>
            <button
              type="button"
              onClick={() => setIsRegistering(false)}
              className="text-amber-400 hover:text-amber-300 font-medium"
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
            <label className="block text-amber-300 text-sm font-medium mb-2">
              Verification Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-center text-lg tracking-widest"
                placeholder="000000"
                maxLength={6}
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
            <label className="block text-amber-300 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                className="w-full pl-10 pr-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                placeholder="Enter password"
                required
              />
            </div>
            {passwordError && <p className="text-red-300 text-sm mt-1">{passwordError}</p>}
          </div>

          <div>
            <label className="block text-amber-300 text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className="w-full pl-10 pr-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                placeholder="Confirm password"
                required
              />
            </div>
            {confirmPasswordError && <p className="text-red-300 text-sm mt-1">{confirmPasswordError}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-900 mr-2"></div>
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
