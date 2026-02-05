/**
 * Authentication API Client
 */
import axios from 'axios';
import { config } from '../config';
import { LoginCredentials, AuthResponse, User } from '../types/auth';

const authClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.requestTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await authClient.post<AuthResponse>('/auth/login', credentials);
  return response.data;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(token: string): Promise<User> {
  const response = await authClient.get<User>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

/**
 * Register new user (if needed in future)
 */
export async function register(data: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResponse> {
  const response = await authClient.post<AuthResponse>('/auth/register', data);
  return response.data;
}
