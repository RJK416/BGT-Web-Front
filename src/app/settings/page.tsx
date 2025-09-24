'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken, getUserFromToken, isAuthenticated } from '@/utils/auth';
import { API_CONFIG } from '@/config/api';

type MyJwtPayload = import('jwt-decode').JwtPayload & {
  name?: string;
  unique_name?: string;
  email?: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('password');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    // Get user info from JWT token
    const userFromToken = getUserFromToken() as MyJwtPayload | null;
                          if (userFromToken) {
                            setUser({
                              username:
                                userFromToken.name ??
                                userFromToken.unique_name ??
                                userFromToken.sub ??
                                'User',
                              email: userFromToken.email ?? 'user@realm.com',
                              joinDate: '2024-01-15',
                            });
}
    
    setIsLoading(false);
  }, [router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setIsPasswordLoading(true);

    try {
      const token = getAuthToken();
      if (!token) {
        setPasswordError('Authentication token not found. Please login again.');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNT.CHANGE_PASSWORD}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          OldPassword: passwordData.currentPassword,
          NewPassword: passwordData.newPassword,
          ConfirmNewPassword: passwordData.confirmPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.status !== 200) {
        throw new Error(data.error || data.message || 'Password change failed');
      }

      setPasswordSuccess(data.message || 'Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setPasswordError(`Cannot connect to server. Please check your backend at ${API_CONFIG.BASE_URL}`);
      } else {
        setPasswordError(error instanceof Error ? error.message : 'Failed to change password. Please try again.');
      }
    } finally {
      setIsPasswordLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-amber-400 text-lg">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 relative overflow-hidden">
      {/* Background decorative shapes */}
      <div className="absolute inset-0 opacity-20">
        {/* Geometric shapes */}
        <div className="absolute top-20 left-20 w-24 h-24 border-2 border-amber-400 transform rotate-45 rounded-lg"></div>
        <div className="absolute top-40 right-20 w-20 h-20 border-2 border-amber-300 transform -rotate-12 rounded-full"></div>
        <div className="absolute bottom-40 left-20 w-28 h-28 border-2 border-amber-500 transform rotate-30 rounded-lg"></div>
        <div className="absolute bottom-20 right-40 w-16 h-16 border-2 border-amber-400 transform -rotate-45 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-18 h-18 border-2 border-amber-300 transform rotate-60 rounded-lg"></div>
        <div className="absolute top-1/3 right-1/4 w-14 h-14 border-2 border-amber-500 transform -rotate-30 rounded-full"></div>
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-amber-300 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-1/4 left-1/2 w-4 h-4 bg-amber-500 rounded-full animate-pulse delay-300"></div>
        
        {/* Dice pairs */}
        <div className="absolute top-24 left-24 flex gap-2">
          <div className="dice dice-6 animate-float">
            <div className="dice-dots">
              <div className="dice-dot"></div>
              <div className="dice-dot"></div>
              <div className="dice-dot"></div>
              <div className="dice-dot"></div>
              <div className="dice-dot"></div>
              <div className="dice-dot"></div>
            </div>
          </div>
          <div className="dice dice-1 animate-float-delayed">
            <div className="dice-dots">
              <div className="dice-dot"></div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-40 left-24 flex gap-2">
          <div className="dice dice-3 animate-float-slow">
            <div className="dice-dots">
              <div className="dice-dot"></div>
              <div className="dice-dot"></div>
              <div className="dice-dot"></div>
            </div>
          </div>
          <div className="dice dice-5 animate-float">
            <div className="dice-dots">
              <div className="dice-dot"></div>
              <div className="dice-dot"></div>
              <div className="dice-dot"></div>
              <div className="dice-dot"></div>
              <div className="dice-dot"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-950/90 to-purple-900/90 backdrop-blur-sm border-b border-amber-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-amber-400 hover:text-amber-300 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-amber-400">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30">
              <h2 className="text-lg font-semibold text-amber-400 mb-4">Account Settings</h2>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSection('password')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 ${
                    activeSection === 'password'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                      : 'text-purple-200 hover:bg-purple-800/50 hover:text-amber-300'
                  }`}
                >
                  Change Password
                </button>
                <button
                  onClick={() => setActiveSection('email')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 ${
                    activeSection === 'email'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                      : 'text-purple-200 hover:bg-purple-800/50 hover:text-amber-300'
                  }`}
                >
                  Change Email
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeSection === 'password' && (
              <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-8 border border-amber-400/30">
                <h2 className="text-2xl font-bold text-amber-400 mb-6">Change Password</h2>
                
                {/* Password Change Form */}
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  {/* Current Password */}
                  <div>
                    <label className="block text-amber-300 text-sm font-medium mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full px-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-amber-300 text-sm font-medium mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full px-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-amber-300 text-sm font-medium mb-2">
                      Repeat New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                  </div>

                  {/* Error Message */}
                  {passwordError && (
                    <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                      <p className="text-red-300 text-sm">{passwordError}</p>
                    </div>
                  )}

                  {/* Success Message */}
                  {passwordSuccess && (
                    <div className="p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                      <p className="text-green-300 text-sm">{passwordSuccess}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isPasswordLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPasswordLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-900 mr-2"></div>
                        Changing Password...
                      </div>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </form>
              </div>
            )}

            {activeSection === 'email' && (
              <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-8 border border-amber-400/30">
                <h2 className="text-2xl font-bold text-amber-400 mb-6">Change Email</h2>
                <p className="text-purple-200">Email change functionality coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
