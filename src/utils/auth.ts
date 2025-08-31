import Cookies from 'js-cookie';

// JWT Token Management
export const setAuthToken = (token: string, rememberMe: boolean = false) => {
  // Set token in cookies with secure options
  // If rememberMe is true, set longer expiration (30 days), otherwise 7 days
  const expires = rememberMe ? 30 : 7;
  
  Cookies.set('auth-token', token, {
    expires: expires,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};

export const getAuthToken = (): string | undefined => {
  return Cookies.get('auth-token');
};

export const removeAuthToken = () => {
  Cookies.remove('auth-token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!token;
};

// Decode JWT token (basic implementation)
export const decodeToken = (token: string) => {
  try {
    // In a real app, you'd use a JWT library like 'jsonwebtoken'
    // For now, we'll do a basic decode
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Get user info from token
export const getUserFromToken = () => {
  const token = getAuthToken();
  if (!token) return null;
  
  return decodeToken(token);
}; 