/**
 * User Management Types
 */
import { User, UserRole } from './auth';

export interface UserListResponse {
  users: User[];
  total: number;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}
