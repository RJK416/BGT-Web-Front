// API Configuration
export const API_CONFIG = {
  // Base URL for your API
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://guild-api-1011546854121.europe-west3.run.app',
  
  // Base URL for static assets (avatars, images, etc.)
  // Google Cloud Storage bucket for hosting pictures
  ASSETS_BASE_URL: process.env.NEXT_PUBLIC_ASSETS_URL || 'https://storage.googleapis.com/guild-hosting-pictures',
  
  // API Endpoints
  ENDPOINTS: {
    // Account Service Endpoints
    ACCOUNT: {
      LOGIN: '/Account/Login',
      REGISTER: '/Account/Universal-OtpSender',
      VERIFY_OTP: '/Account/Universal-OtpVerify',
      COMPLETE_REGISTRATION: '/Account/Account-Creation/Complete',
      CHANGE_PASSWORD: '/Account/PasswordChange',
      RESET_PASSWORD: '/Account/Passwrod-Reset/Complete',
      GET_PROFILE: '/Account/Profile',
      GET_PROFILE_BY_USERNAME: '/Account/Profile/:username',
      UPLOAD_AVATAR: '/Account/Avatar/Upload',
    },
    // Board Game Service Endpoints
    BOARDGAME: {
      ADD: '/Boardgame/Add-Boardgame',
      ADD_OWNER: '/Boardgame/Add-Boardgame-Owner',
      GET_LEADERBOARD: '/Boardgame/Get-Leaderboard',
      GET_BOARDGAMES: '/Boardgame/Get-Boardgames', // legacy
      GET_TOURNAMENTS: '/Boardgame/Get-Tournaments',
      GET_TOURNAMENTS_WITH_GM: '/Boardgame/Get-Tournaments-With-GM',
      GET_TOURNAMENT_MEMBERS: '/Boardgame/Get-Tournament-Members',
      GET_MY_TOURNAMENTS: '/Boardgame/Get-My-Tournaments',
      GET_MY_TOURNAMENTS_WITH_GM: '/Boardgame/My-Tournaments-With-GM',
      GET_USER_PLAYER: '/Boardgame/Get-User-Player',
      CREATE_TOURNAMENT: '/Boardgame/Create-Boardgame-Tournament',
      ADD_TOURNAMENT_MEMBER: '/Boardgame/Add-Tournament-Member',
      REMOVE_TOURNAMENT_MEMBER: '/Boardgame/Remove-Tournament-Member',
      UPDATE_TOURNAMENT: '/Boardgame/Update-Tournament',
      APPOINT_GM_BY_USERNAME: '/Boardgame/Appoint-GM-By-Username',
    },
    // Notification Service Endpoints
    NOTIFICATION: {
      GET_ALL: '/api/Notification/Get-My-Notifications',
      GET_UNREAD: '/api/Notification/Get-Unread-Notifications',
      GET_UNREAD_COUNT: '/api/Notification/Get-Unread-Count',
      MARK_AS_READ: '/api/Notification/Mark-As-Read',
      MARK_ALL_AS_READ: '/api/Notification/Mark-All-As-Read',
    },
    // Guild Service Endpoints
    GUILD: {
      ADD: '/Guild/Add-Guild',
      GET_MY_GUILD: '/Guild/Get-My-Guild',
      GET_ALL: '/Get-All-Guilds',
      GET_BY_ID: '/Guild/Get-Guild-By-Id',
      GET_BY_NAME: '/Guild/Get-Guild-By-Name',
      SEND_INVITATION: '/Guild/Send-Guild-Invitation',
      RESPOND_INVITATION: '/Recieve-Guild-Invitation-Respond',
      GET_MEMBER_BY_USERNAME: '/Guild/Get-Guild-Member-By-Username',
      GET_MY_INVITATIONS: '/Guild/Get-My-Received-Invitations',
      GET_ALL_MEMBERS: '/Guild/Get-All-Guild-Members',
      GET_MY_MEMBERS: '/Guild/Get-My-Guild-Members',
      APPOINT_GM: '/Guild/Appoint-GM',
    },
    // Legacy endpoints
    PRODUCTS: '/api/products',
    CATEGORIES: '/api/categories',
    PRODUCT_DETAIL: '/api/products/:id',
  },
  
  // Request timeout (in milliseconds)
  TIMEOUT: 10000,
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string>) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }
  
  return url;
};

// Helper function for API requests
export const apiRequest = async (url: string, options?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        data = { error: 'Invalid JSON response from server' };
      }
    } else {
      // Handle non-JSON responses (HTML error pages, etc.)
      const textResponse = await response.text();
      console.error('Non-JSON response received:', {
        status: response.status,
        contentType,
        body: textResponse.substring(0, 200) // First 200 chars for debugging
      });
      data = { 
        error: `Server returned ${response.status} ${response.statusText}`,
        details: textResponse.substring(0, 200)
      };
    }
    
    // Return data with status for error handling in components
    return {
      ...data,
      status: response.status,
      ok: response.ok
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Helper function to build full avatar URL from relative path
 * @param avatarPath - Relative path from database (e.g., "avatars/1/915cb1546f274393a9066c33540ca9bc.png")
 * @returns Full URL to the avatar image, or null if path is invalid
 */
export const getAvatarUrl = (avatarPath: string | null | undefined): string | null => {
  if (!avatarPath || avatarPath.trim() === '') {
    return null;
  }
  
  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = avatarPath.startsWith('/') ? avatarPath.slice(1) : avatarPath;
  
  // Construct full URL
  const baseUrl = API_CONFIG.ASSETS_BASE_URL.endsWith('/') 
    ? API_CONFIG.ASSETS_BASE_URL.slice(0, -1) 
    : API_CONFIG.ASSETS_BASE_URL;
  
  return `${baseUrl}/${cleanPath}`;
}; 