import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

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