'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken, getUserFromToken, isAuthenticated } from '@/utils/auth';

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
    const userFromToken = getUserFromToken();
    if (userFromToken) {
      setUser({
        username: userFromToken.unique_name || userFromToken.sub || 'AdventureSeeker',
        email: userFromToken.email || 'adventure@realm.com',
        joinDate: '2024-01-15'
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

      const response = await fetch('https://localhost:7056/Account/PasswordChange', {
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
        setPasswordError('Cannot connect to server. Please start your backend API on https://localhost:7056');
      } else {
        setPasswordError(error instanceof Error ? error.message : 'Failed to change password. Please try again.');
      }
    } finally {
      setIsPasswordLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-amber-400 text-lg">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400">
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
