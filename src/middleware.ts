import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the token from cookies
  const token = request.cookies.get('auth-token')?.value;

  // Handle root page - redirect authenticated users to dashboard
  if (request.nextUrl.pathname === '/') {
    if (token) {
      // Check if token is valid
      try {
        const tokenParts = token.split('.');
        
        if (tokenParts.length === 3) {
          // Decode the payload to check expiration
          try {
            const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (payload.exp && payload.exp >= currentTime) {
              // Token is valid, redirect to dashboard
              return NextResponse.redirect(new URL('/dashboard', request.url));
            }
          } catch (decodeError) {
            // Invalid token payload, clear cookie and show login
            const response = NextResponse.next();
            response.cookies.delete('auth-token');
            return response;
          }
        }
      } catch (error) {
        // Invalid token, clear cookie and show login
        const response = NextResponse.next();
        response.cookies.delete('auth-token');
        return response;
      }
    }
    // No token or invalid token, show login page
    return NextResponse.next();
  }

  // Check if the user is trying to access protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/settings') ||
      request.nextUrl.pathname.startsWith('/guild') ||
      request.nextUrl.pathname.startsWith('/tournaments')) {
    if (!token) {
      // Redirect to login if no token is found
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      // Basic JWT token validation
      // In a real app, you'd verify the JWT signature here
      // For now, we'll check if the token has the expected structure
      const tokenParts = token.split('.');
      
      if (tokenParts.length !== 3) {
        // Invalid JWT format
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('auth-token');
        return response;
      }

      // Decode the payload to check expiration
      try {
        const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < currentTime) {
          // Token has expired
          const response = NextResponse.redirect(new URL('/', request.url));
          response.cookies.delete('auth-token');
          return response;
        }
      } catch (decodeError) {
        // Invalid token payload
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('auth-token');
        return response;
      }
      
      // If token is valid, allow access
      return NextResponse.next();
    } catch (error) {
      // If token is invalid, redirect to login
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }

  // Allow access to public routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 