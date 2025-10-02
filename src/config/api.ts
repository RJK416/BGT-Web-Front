// API Configuration
export const API_CONFIG = {
  // Base URL for your API
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://a9mykszmmd.eu-central-1.awsapprunner.com',
  
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
    console.log('Making API request to:', url);
    console.log('Request options:', options);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    // Return data with status for error handling in components
    return {
      ...data,
      status: response.status,
      ok: response.ok
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('API request error:', error);
    throw error;
  }
}; 