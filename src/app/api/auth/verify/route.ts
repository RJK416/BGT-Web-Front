import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // In a real app, you'd verify the JWT token here
    // For now, we'll just check if the token exists
    // You can add proper JWT verification logic here

    return NextResponse.json(
      { valid: true, message: 'Token is valid' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
} 