/**
 * User Management API Client
 */
import axios from 'axios';
import { config } from '../config';
import { User, UserRole } from '../types/auth';
import { UserListResponse, CreateUserRequest, UpdateUserRequest, DeleteUserResponse } from '../types/user';

const usersClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.requestTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
export function setUsersAuthToken(token: string | null) {
  if (token) {
    usersClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete usersClient.defaults.headers.common['Authorization'];
  }
}

/**
 * Get all users (admin only)
 */
export async function getUsers(): Promise<UserListResponse> {
  const response = await usersClient.get<UserListResponse>('/users');
  return response.data;
}

/**
 * Get user by ID (admin only)
 */
export async function getUser(userId: string): Promise<User> {
  const response = await usersClient.get<User>(`/users/${userId}`);
  return response.data;
}

/**
 * Create a new user (admin only)
 */
export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await usersClient.post<User>('/users', data);
  return response.data;
}

/**
 * Update user (admin only)
 */
export async function updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
  const response = await usersClient.patch<User>(`/users/${userId}`, data);
  return response.data;
}

/**
 * Update user role specifically (admin only)
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<User> {
  const response = await usersClient.patch<User>(`/users/${userId}/role`, { role });
  return response.data;
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: string): Promise<DeleteUserResponse> {
  const response = await usersClient.delete<DeleteUserResponse>(`/users/${userId}`);
  return response.data;
}

/**
 * Error handler for 403 Forbidden
 */
export function handleForbiddenError(error: unknown): boolean {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return true;
  }
  return false;
}
