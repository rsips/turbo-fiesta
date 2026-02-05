// JWT Token Utilities

import jwt, { SignOptions } from 'jsonwebtoken';
import { TokenPayload } from '../types/auth';

const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET || 'default-dev-secret-change-in-production';
const JWT_EXPIRATION = '24h'; // Fixed value - can be overridden in SignOptions

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRATION as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload as object, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT token
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Decode a token without verification (for debugging)
 */
export function decodeToken(token: string): TokenPayload | null {
  return jwt.decode(token) as TokenPayload | null;
}
