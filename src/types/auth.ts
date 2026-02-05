// Authentication types

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // bcrypt hash
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface TokenPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user?: UserPublic;
    token?: string;
    expiresIn?: string;
    message?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
