'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken, getUserFromToken, isAuthenticated } from '@/utils/auth';
import { API_CONFIG, apiRequest } from '@/config/api';
import { accountService } from '@/services/accountService';

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
  const [qrData, setQrData] = useState<{ dataUrl: string; payload: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
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

  const handleGenerateQr = async () => {
    setQrError(null);
    setQrLoading(true);
    try {
      const response = await accountService.getQrCode();
      if (response.ok && response.status === 200 && response.data) {
        // Handle both PascalCase (from backend) and camelCase
        const qrData = response.data;
        setQrData({
          dataUrl: qrData.DataUrl || qrData.dataUrl,
          payload: qrData.Payload || qrData.payload
        });
      } else {
        setQrError(response.error || response.message || 'Failed to generate QR code');
      }
    } catch (error: any) {
      setQrError(error?.message || 'Failed to generate QR code');
    } finally {
      setQrLoading(false);
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

  const pageBackgroundStyle = {
    background: 'linear-gradient(135deg, rgba(21, 49, 39, 0.95), rgba(13, 32, 26, 0.95))',
    minHeight: '100vh',
    position: 'relative' as const,
    overflow: 'hidden' as const
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={pageBackgroundStyle}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#E7B45D] mx-auto mb-4"></div>
          <p className="text-[#F4EBD0] text-lg">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={pageBackgroundStyle}>
      {/* Header - Mobile Optimized */}
      <header className="relative z-10 backdrop-blur-sm border-b border-[#9C6B3E]/40" style={{background: 'linear-gradient(to right, rgba(26, 95, 82, 0.95), rgba(15, 66, 52, 0.95))'}}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-3">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                style={{
                  padding: '6px 12px',
                  background: 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                  border: '1px solid rgba(156, 107, 62, 0.7)',
                  borderRadius: '8px',
                  color: '#2A1D12',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                className="hover:opacity-90"
              >
Back to Dashboard
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F4EBD0] medieval-heading">SETTINGS</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Left Sidebar - Mobile Optimized */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="medieval-panel p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-[#F4EBD0] medieval-heading mb-4">ACCOUNT SETTINGS</h2>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSection('avatar')}
                  className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                    activeSection === 'avatar'
                      ? 'bg-[#E7B45D]/20 text-[#F4EBD0] border border-[#E7B45D]/50'
                      : 'text-[#B6AA96] hover:bg-[#2A1D12]/50 hover:text-[#F4EBD0]'
                  }`}
                >
                  Profile Avatar
                </button>
                <button
                  onClick={() => setActiveSection('password')}
                  className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                    activeSection === 'password'
                      ? 'bg-[#E7B45D]/20 text-[#F4EBD0] border border-[#E7B45D]/50'
                      : 'text-[#B6AA96] hover:bg-[#2A1D12]/50 hover:text-[#F4EBD0]'
                  }`}
                >
                  Change Password
                </button>
                <button
                  onClick={() => setActiveSection('email')}
                  className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                    activeSection === 'email'
                      ? 'bg-[#E7B45D]/20 text-[#F4EBD0] border border-[#E7B45D]/50'
                      : 'text-[#B6AA96] hover:bg-[#2A1D12]/50 hover:text-[#F4EBD0]'
                  }`}
                >
                  Change Email
                </button>
                <button
                  onClick={() => setActiveSection('qr')}
                  className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                    activeSection === 'qr'
                      ? 'bg-[#E7B45D]/20 text-[#F4EBD0] border border-[#E7B45D]/50'
                      : 'text-[#B6AA96] hover:bg-[#2A1D12]/50 hover:text-[#F4EBD0]'
                  }`}
                >
                  My QR Code
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content - Mobile Optimized */}
          <div className="flex-1">
            {activeSection === 'avatar' && (
              <div className="medieval-panel p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-[#F4EBD0] medieval-heading mb-4 sm:mb-6">PROFILE AVATAR</h2>
                
                {/* Current Avatar Display - Mobile Optimized */}
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold text-[#d4b077] mb-3 sm:mb-4">CURRENT AVATAR</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[#E7B45D] mx-auto sm:mx-0" style={{boxShadow: '0 0 10px rgba(231, 180, 93, 0.3)'}}>
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
                      <div className={`w-full h-full bg-gradient-to-br from-[#E7B45D] to-[#B17A3D] flex items-center justify-center ${userProfile?.avatarUrl ? 'hidden' : ''}`}>
                        <span className="text-2xl sm:text-3xl font-bold text-[#2A1D12]">
                          {userProfile?.userName?.charAt(0).toUpperCase() || (user as any)?.username?.charAt(0).toUpperCase() || (user as any)?.name?.charAt(0).toUpperCase() || (user as any)?.unique_name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-[#F4EBD0] text-sm sm:text-base">
                        {userProfile?.avatarUrl ? 'You have a custom avatar' : 'Using default avatar'}
                      </p>
                      <p className="text-[#B6AA96] text-xs sm:text-sm mt-1">
                        Supported formats: JPG, PNG, WebP (max 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload New Avatar - Mobile Optimized */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-[#d4b077] mb-3 sm:mb-4">UPLOAD NEW AVATAR</h3>
                  
                  {/* Drag and Drop Area - Mobile Optimized */}
                  <div className="border-2 border-dashed border-[#9C6B3E]/50 rounded-xl p-4 sm:p-6 lg:p-8 text-center hover:border-[#E7B45D]/60 transition-colors" style={{background: 'linear-gradient(135deg, rgba(42, 29, 18, 0.5) 0%, rgba(52, 28, 15, 0.5) 100%)'}}>
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
                          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#E7B45D] mx-auto"></div>
                        ) : (
                          <svg className="w-8 h-8 sm:w-12 sm:h-12 text-[#E7B45D] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-[#F4EBD0] font-medium mb-2 text-sm sm:text-base">
                        {isUploadingAvatar ? 'Uploading...' : 'Tap to choose from gallery or camera'}
                      </p>
                      <p className="text-[#B6AA96] text-xs sm:text-sm">
                        JPG, PNG, WebP up to 5MB
                      </p>
                    </label>
                  </div>
                </div>

                {/* Error Message */}
                {avatarError && (
                  <div className="mb-4 p-3 rounded-lg" style={{background: 'rgba(128, 44, 44, 0.2)', border: '1px solid rgba(128, 44, 44, 0.5)'}}>
                    <p className="text-[#F4EBD0] text-sm">{avatarError}</p>
                  </div>
                )}

                {/* Success Message */}
                {avatarSuccess && (
                  <div className="mb-4 p-3 rounded-lg" style={{background: 'rgba(60, 122, 87, 0.2)', border: '1px solid rgba(60, 122, 87, 0.5)'}}>
                    <p className="text-[#F4EBD0] text-sm">{avatarSuccess}</p>
                  </div>
                )}

                {/* Upload Button Alternative */}
                <div className="text-center">
                  <label
                    htmlFor="avatar-upload"
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                      border: '1px solid rgba(156, 107, 62, 0.7)',
                      borderRadius: '8px',
                      color: '#2A1D12',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s',
                      cursor: isUploadingAvatar ? 'not-allowed' : 'pointer',
                      opacity: isUploadingAvatar ? 0.5 : 1,
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                    className="hover:opacity-90"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2A1D12] mr-2"></div>
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
              <div className="medieval-panel p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-[#F4EBD0] medieval-heading mb-4 sm:mb-6">CHANGE PASSWORD</h2>
                
                {/* Password Change Form - Mobile Optimized */}
                <form onSubmit={handlePasswordChange} className="space-y-4 sm:space-y-6">
                  {/* Current Password */}
                  <div>
                    <label className="block text-[#F4EBD0] text-sm font-medium mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#2A1D12]/90 border border-[#9C6B3E]/50 rounded-lg text-[#F4EBD0] placeholder-[#B6AA96] focus:outline-none focus:ring-2 focus:ring-[#E7B45D]/60 focus:border-[#E7B45D]/40 transition-all text-sm sm:text-base"
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-[#F4EBD0] text-sm font-medium mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#2A1D12]/90 border border-[#9C6B3E]/50 rounded-lg text-[#F4EBD0] placeholder-[#B6AA96] focus:outline-none focus:ring-2 focus:ring-[#E7B45D]/60 focus:border-[#E7B45D]/40 transition-all text-sm sm:text-base"
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-[#F4EBD0] text-sm font-medium mb-2">
                      Repeat New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#2A1D12]/90 border border-[#9C6B3E]/50 rounded-lg text-[#F4EBD0] placeholder-[#B6AA96] focus:outline-none focus:ring-2 focus:ring-[#E7B45D]/60 focus:border-[#E7B45D]/40 transition-all text-sm sm:text-base"
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                  </div>

                  {/* Error Message */}
                  {passwordError && (
                    <div className="p-3 rounded-lg" style={{background: 'rgba(128, 44, 44, 0.2)', border: '1px solid rgba(128, 44, 44, 0.5)'}}>
                      <p className="text-[#F4EBD0] text-sm">{passwordError}</p>
                    </div>
                  )}

                  {/* Success Message */}
                  {passwordSuccess && (
                    <div className="p-3 rounded-lg" style={{background: 'rgba(60, 122, 87, 0.2)', border: '1px solid rgba(60, 122, 87, 0.5)'}}>
                      <p className="text-[#F4EBD0] text-sm">{passwordSuccess}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isPasswordLoading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                      border: '1px solid rgba(156, 107, 62, 0.7)',
                      borderRadius: '8px',
                      color: '#2A1D12',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s',
                      opacity: isPasswordLoading ? 0.5 : 1,
                      cursor: isPasswordLoading ? 'not-allowed' : 'pointer'
                    }}
                    className="hover:opacity-90"
                  >
                    {isPasswordLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2A1D12] mr-2"></div>
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
              <div className="medieval-panel p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-[#F4EBD0] medieval-heading mb-4 sm:mb-6">CHANGE EMAIL</h2>
                <p className="text-[#B6AA96] text-sm sm:text-base">Email change functionality coming soon...</p>
              </div>
            )}

            {activeSection === 'qr' && (
              <div className="medieval-panel p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-[#F4EBD0] medieval-heading mb-4 sm:mb-6">MY QR CODE</h2>
                <p className="text-[#B6AA96] text-sm sm:text-base mb-6">
                  Generate a QR code for your account. Stay logged in to create and display it.
                </p>

                {/* Generate QR Code Button */}
                <div className="mb-6">
                  <button
                    onClick={handleGenerateQr}
                    disabled={qrLoading}
                    style={{
                      width: '100%',
                      padding: '12px 24px',
                      background: 'linear-gradient(180deg, #E7B45D 0%, #B17A3D 100%)',
                      color: '#2A1D12',
                      border: '1px solid rgba(156, 107, 62, 0.7)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s',
                      opacity: qrLoading ? 0.7 : 1,
                      cursor: qrLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    className="hover:opacity-90"
                    onMouseEnter={(e) => {
                      if (!qrLoading) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!qrLoading) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)';
                      }
                    }}
                  >
                    {qrLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2A1D12]"></div>
                        <span>Generating QR Code...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <span>Generate QR Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Error Message */}
                {qrError && (
                  <div className="mb-6 p-4 rounded-lg" style={{background: 'rgba(128, 44, 44, 0.2)', border: '1px solid rgba(128, 44, 44, 0.5)'}}>
                    <p className="text-[#F4EBD0] text-sm flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {qrError}
                    </p>
                  </div>
                )}

                {/* QR Code Display */}
                {qrData && qrData.dataUrl && (
                  <div className="mt-6 space-y-6">
                    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 p-6 rounded-lg" style={{background: 'linear-gradient(135deg, rgba(42, 29, 18, 0.5) 0%, rgba(52, 28, 15, 0.5) 100%)', border: '1px solid rgba(156, 107, 62, 0.3)'}}>
                      {/* QR Code Image */}
                      <div className="flex-shrink-0">
                        <div className="p-4 rounded-lg" style={{background: 'rgba(255, 255, 255, 0.95)', border: '2px solid rgba(231, 180, 93, 0.5)'}}>
                          <img
                            src={qrData.dataUrl}
                            alt="User QR code"
                            className="w-48 h-48 sm:w-56 sm:h-56"
                          />
                        </div>
                        <p className="text-center text-[#B6AA96] text-xs mt-2">Scan to view profile</p>
                      </div>
                      
                      {/* Payload Info */}
                      {qrData.payload && (
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[#F4EBD0] font-semibold mb-2 text-sm sm:text-base">QR Code Payload</h3>
                          <div className="p-3 rounded-md border border-[#9C6B3E]/40 bg-[#1F140D]/60">
                            <p className="text-[#B6AA96] text-xs sm:text-sm break-all font-mono">
                              {qrData.payload}
                            </p>
                          </div>
                          <p className="text-[#B6AA96] text-xs mt-2">This payload contains your account information</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
