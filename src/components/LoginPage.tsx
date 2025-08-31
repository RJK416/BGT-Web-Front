'use client';

import { useState } from 'react';
import { setAuthToken } from '@/utils/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    setPasswordError(null);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Create the request body with proper property names
      const requestBody = {
        username: username,
        password: password,
      };
      
      console.log('🔍 Sending login request:', requestBody);
      
      // Login with username and password
      const response = await fetch('https://localhost:7056/Account/Login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        if (response.status === 415) {
          throw new Error('API expects different content type. Please check your API configuration.');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 200) {
        throw new Error(data.message || 'Login failed');
      }

             // Store the JWT token from the response
       const jwtToken = data.data || data.token || data.jwt;
       if (jwtToken) {
         setAuthToken(jwtToken, rememberMe);
         console.log('🔍 JWT token stored successfully', rememberMe ? '(remember me enabled - 30 days)' : '(7 days expiration)');
       } else {
         console.warn('⚠️ No JWT token found in response:', data);
       }

      // Redirect to dashboard on successful login
      window.location.href = '/dashboard';
      
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please make sure your API is running on https://localhost:7056');
      } else {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password before submitting
    if (!validatePassword(password)) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Send OTP for account creation - update the URL to match your API
      const response = await fetch('https://localhost:7056/Account/OtpSender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Username: username,
          Mail: email,
          Password: password, // In production, hash this on client side
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 200) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setSuccess('OTP sent to your email! Please check and enter the code.');
      setShowOtpInput(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // The API expects: [FromBody] OtpRequest otpRequest
      // So we send both Otp and UserName in the request body
      const response = await fetch('https://localhost:7056/Account/OtpVerifier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Otp: otp,
          UserName: username,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 200) {
        throw new Error(data.error || 'OTP verification failed');
      }

      setSuccess('Account created successfully! You can now login.');
      setShowOtpInput(false);
      setIsRegistering(false);
      setOtp('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
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
              {/* Cool big shield icon */}
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mb-4 shadow-lg">
                <svg className="w-16 h-16 text-purple-900" fill="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                  {/* Shield body */}
                  <path d="M12 2L4 6v8c0 4 3 6 8 8 5-2 8-4 8-8V6l-8-4z"/>
                  
                  {/* Shield border */}
                  <path d="M12 2L4 6v8c0 4 3 6 8 8 5-2 8-4 8-8V6l-8-4z" fill="none" stroke="purple-800" strokeWidth="0.5"/>
                  
                  {/* Shield boss (center circle) */}
                  <circle cx="12" cy="10" r="2" fill="amber-300"/>
                  
                  {/* Shield straps */}
                  <path d="M10 8h4v1h-4V8z" fill="amber-300"/>
                  <path d="M10 12h4v1h-4V12z" fill="amber-300"/>
                  
                  {/* Shield decorative elements */}
                  <path d="M12 4L10 6h4L12 4z" fill="amber-300"/>
                  <path d="M12 16L10 18h4L12 16z" fill="amber-300"/>
                  
                  {/* Shield rivets */}
                  <circle cx="8" cy="8" r="0.5" fill="amber-300"/>
                  <circle cx="16" cy="8" r="0.5" fill="amber-300"/>
                  <circle cx="8" cy="12" r="0.5" fill="amber-300"/>
                  <circle cx="16" cy="12" r="0.5" fill="amber-300"/>
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-amber-600 mb-2 tracking-wider">
              Board Games Tracker
            </h1>
            <p className="text-purple-700 text-lg">
              Chronicle Your Adventures
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
                {isRegistering ? 'Join the Realm' : 'Enter the Realm'}
              </h2>
              <p className="text-purple-200 text-sm">
                {isRegistering ? 'Create your account to start tracking' : 'Sign in to track your board game collection'}
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

            {!showOtpInput ? (
              <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
                {/* Username field (for registration) */}
                {isRegistering && (
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
                        required={isRegistering}
                      />
                    </div>
                  </div>
                )}

                {/* Username field (for login) */}
                {!isRegistering && (
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
                )}

                {/* Email field (for registration only) */}
                {isRegistering && (
                  <div>
                    <label className="block text-amber-300 text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Password field */}
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
                      className={`w-full pl-10 pr-4 py-3 bg-purple-950/70 border rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all ${
                        passwordError ? 'border-red-400' : 'border-amber-400/40'
                      }`}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    {passwordError && (
                      <p className="text-red-300 text-xs mt-1">{passwordError}</p>
                    )}
                  </div>
                </div>

                {/* Remember me (only for login) */}
                {!isRegistering && (
                  <div className="flex items-center justify-between">
                                         <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={rememberMe}
                         onChange={(e) => setRememberMe(e.target.checked)}
                         className="h-4 w-4 text-amber-400 focus:ring-amber-400 border-amber-400/40 rounded bg-purple-950/70"
                       />
                       <span className="ml-2 text-sm text-purple-200">Remember me</span>
                     </label>
                                         <a
                       href="/password-reset"
                       className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                     >
                       Forgot password?
                     </a>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-900 mr-2"></div>
                      {isRegistering ? 'Creating...' : 'Entering...'}
                    </div>
                  ) : (
                    isRegistering ? 'Join the Realm' : 'Enter the Realm'
                  )}
                </button>
              </form>
            ) : (
              /* OTP Verification Form */
              <form onSubmit={handleOtpVerification} className="space-y-6">
                <div>
                  <label className="block text-amber-300 text-sm font-medium mb-2">
                    Enter OTP
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
                      className="w-full pl-10 pr-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                      placeholder="Enter 6-digit OTP"
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
                    'Verify OTP'
                  )}
                </button>
              </form>
            )}

            {/* Toggle between login and register */}
            <div className="mt-6 text-center">
              <p className="text-purple-200 text-sm">
                {isRegistering ? 'Already have an account? ' : 'New to the realm? '}
                <button
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError(null);
                    setSuccess(null);
                    setShowOtpInput(false);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  {isRegistering ? 'Sign in' : 'Create an account'}
                </button>
              </p>
            </div>
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