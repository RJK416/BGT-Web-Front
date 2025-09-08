// API Configuration
export const API_CONFIG = {
  // Base URL for your API
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7056',
  
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
    },
    // Board Game Service Endpoints
    BOARDGAME: {
      ADD: '/api/Boardgame/Add-Boardgame',
      ADD_OWNER: '/api/Boardgame/Add-Boardgame-Owner',
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