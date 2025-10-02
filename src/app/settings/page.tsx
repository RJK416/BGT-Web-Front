'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken, getUserFromToken, isAuthenticated } from '@/utils/auth';
import { API_CONFIG, apiRequest } from '@/config/api';

type MyJwtPayload = import('jwt-decode').JwtPayload & {
  name?: string;
  unique_name?: string;
  email?: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('avatar');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const router = useRouter();

  const fetchUserProfile = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }
      const response = await apiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNT.GET_PROFILE}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok && response.status === 200) {
        setUserProfile(response.data);
      } else {
        console.error('Failed to fetch user profile:', response);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

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
    
    // Fetch profile data
    fetchUserProfile();
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

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;

    setAvatarError(null);
    setAvatarSuccess(null);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setAvatarError('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCOUNT.UPLOAD_AVATAR}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.status === 200) {
        setAvatarSuccess('Avatar uploaded successfully!');
        // Refresh profile to show new avatar
        await fetchUserProfile();
      } else {
        throw new Error(result.error || result.message || 'Failed to upload avatar');
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setAvatarError(error.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
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
      
      {/* Header - Mobile Optimized */}
      <header className="bg-gradient-to-r from-purple-950/90 to-purple-900/90 backdrop-blur-sm border-b border-amber-400/30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-3">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-amber-400 hover:text-amber-300 transition-colors text-sm sm:text-base"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-amber-400">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Left Sidebar - Mobile Optimized */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-amber-400/30">
              <h2 className="text-base sm:text-lg font-semibold text-amber-400 mb-4">Account Settings</h2>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSection('avatar')}
                  className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                    activeSection === 'avatar'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                      : 'text-purple-200 hover:bg-purple-800/50 hover:text-amber-300'
                  }`}
                >
                  Profile Avatar
                </button>
                <button
                  onClick={() => setActiveSection('password')}
                  className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                    activeSection === 'password'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                      : 'text-purple-200 hover:bg-purple-800/50 hover:text-amber-300'
                  }`}
                >
                  Change Password
                </button>
                <button
                  onClick={() => setActiveSection('email')}
                  className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base ${
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

          {/* Main Content - Mobile Optimized */}
          <div className="flex-1">
            {activeSection === 'avatar' && (
              <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 border border-amber-400/30">
                <h2 className="text-xl sm:text-2xl font-bold text-amber-400 mb-4 sm:mb-6">Profile Avatar</h2>
                
                {/* Current Avatar Display - Mobile Optimized */}
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold text-amber-300 mb-3 sm:mb-4">Current Avatar</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-amber-400 mx-auto sm:mx-0">
                      {userProfile?.avatarUrl ? (
                        <img
                          src={userProfile.avatarUrl}
                          alt={userProfile.userName || 'User'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center ${userProfile?.avatarUrl ? 'hidden' : ''}`}>
                        <span className="text-2xl sm:text-3xl font-bold text-purple-900">
                          {userProfile?.userName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-purple-200 text-sm sm:text-base">
                        {userProfile?.avatarUrl ? 'You have a custom avatar' : 'Using default avatar'}
                      </p>
                      <p className="text-purple-300 text-xs sm:text-sm mt-1">
                        Supported formats: JPG, PNG, WebP (max 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload New Avatar - Mobile Optimized */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-amber-300 mb-3 sm:mb-4">Upload New Avatar</h3>
                  
                  {/* Drag and Drop Area - Mobile Optimized */}
                  <div className="border-2 border-dashed border-amber-400/40 rounded-xl p-4 sm:p-6 lg:p-8 text-center hover:border-amber-400/60 transition-colors">
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleAvatarUpload(file);
                        }
                      }}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                    
                    <label
                      htmlFor="avatar-upload"
                      className={`cursor-pointer block ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="mb-3 sm:mb-4">
                        {isUploadingAvatar ? (
                          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-amber-400 mx-auto"></div>
                        ) : (
                          <svg className="w-8 h-8 sm:w-12 sm:h-12 text-amber-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-amber-300 font-medium mb-2 text-sm sm:text-base">
                        {isUploadingAvatar ? 'Uploading...' : 'Tap to choose from gallery or camera'}
                      </p>
                      <p className="text-purple-300 text-xs sm:text-sm">
                        JPG, PNG, WebP up to 5MB
                      </p>
                    </label>
                  </div>
                </div>

                {/* Error Message */}
                {avatarError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                    <p className="text-red-300 text-sm">{avatarError}</p>
                  </div>
                )}

                {/* Success Message */}
                {avatarSuccess && (
                  <div className="mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                    <p className="text-green-300 text-sm">{avatarSuccess}</p>
                  </div>
                )}

                {/* Upload Button Alternative */}
                <div className="text-center">
                  <label
                    htmlFor="avatar-upload"
                    className={`inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-bold rounded-lg transition-all duration-300 transform hover:scale-105 ${
                      isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {isUploadingAvatar ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-900 mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Choose File
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            {activeSection === 'password' && (
              <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 border border-amber-400/30">
                <h2 className="text-xl sm:text-2xl font-bold text-amber-400 mb-4 sm:mb-6">Change Password</h2>
                
                {/* Password Change Form - Mobile Optimized */}
                <form onSubmit={handlePasswordChange} className="space-y-4 sm:space-y-6">
                  {/* Current Password */}
                  <div>
                    <label className="block text-amber-300 text-sm font-medium mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-sm sm:text-base"
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
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-sm sm:text-base"
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
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-purple-950/70 border border-amber-400/40 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-sm sm:text-base"
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
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-900 font-bold py-2 sm:py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
              <div className="bg-gradient-to-br from-purple-950/90 to-purple-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 border border-amber-400/30">
                <h2 className="text-xl sm:text-2xl font-bold text-amber-400 mb-4 sm:mb-6">Change Email</h2>
                <p className="text-purple-200 text-sm sm:text-base">Email change functionality coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
