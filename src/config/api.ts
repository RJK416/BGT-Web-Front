// API Configuration
export const API_CONFIG = {
  // Base URL for your API
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7000',
  
  // API Endpoints
  ENDPOINTS: {
    PRODUCTS: '/api/products',
    CATEGORIES: '/api/categories',
    PRODUCT_DETAIL: '/api/products/:id',
    BOARDGAME: {
      ADD: '/api/Boardgame/Add-Boardgame',
      ADD_OWNER: '/api/Boardgame/Add-Boardgame-Owner',
    },
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
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}; 