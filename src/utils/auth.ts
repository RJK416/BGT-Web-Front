import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

// JWT Token Management
export const setAuthToken = (token: string, rememberMe: boolean = false) => {
  // Persist across sessions only if rememberMe is true; otherwise use a session cookie
  if (rememberMe) {
    Cookies.set('auth-token', token, {
      expires: 30, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  } else {
    // Session cookie (no expires) — cleared when the browser is closed
    Cookies.set('auth-token', token, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  }
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

// Decode JWT token using jwt-decode library
export const decodeToken = (token: string) => {
  try {
    const decoded = jwtDecode(token);
    return decoded;
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