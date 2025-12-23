# Implementing Better Authentication

## Recommended Approach: JWT with Context Propagation

Let's implement a clean, secure authentication system that eliminates the current complexity.

## Step 1: Create JWT Utilities
<tool_call>write
<arg_key>content</arg_key>
<arg_value>import jwt from 'jsonwebtoken';
import { z } from 'zod';

// JWT Payload Schema
export interface JWTPayload {
  userId: string;
  email: string;
  sessionId: string;
  iat: number;
  exp: number;
}

// Create JWT Token
export function createJWT(user: { id: string; email: string }): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    sessionId: crypto.randomUUID(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    algorithm: 'HS256',
  });
}

// Verify JWT Token
export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Authentication Context
export interface AuthContext {
  userId: string;
  email: string;
  sessionId: string;
  token: string;
}

// Authentication Error
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Auth Middleware for Hono
export function authMiddleware() {
  return async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      c.set('auth', null);
      return next();
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    const payload = verifyJWT(token);

    if (!payload) {
      c.set('auth', null);
      return next();
    }

    // Check if token is expired
    if (Date.now() / 1000 > payload.exp) {
      c.set('auth', null);
      return next();
    }

    const authContext: AuthContext = {
      userId: payload.userId,
      email: payload.email,
      sessionId: payload.sessionId,
      token,
    };

    c.set('auth', authContext);
    return next();
  };
}

// Helper function to require authentication
export function requireAuth(c: any): AuthContext {
  const auth = c.get('auth');
  
  if (!auth) {
    throw new AuthError('Authentication required');
  }
  
  return auth;
}