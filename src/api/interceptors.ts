/**
 * Axios Interceptors for Authentication
 * Adds auth headers and handles 401 responses
 */
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

let requestInterceptorId: number | null = null;
let responseInterceptorId: number | null = null;
let currentToken: string | null = null;
let logoutCallback: (() => void) | null = null;

/**
 * Setup axios interceptors for authentication
 */
export function setupAuthInterceptor(token: string, onLogout: () => void): void {
  currentToken = token;
  logoutCallback = onLogout;

  // Remove existing interceptors if any
  removeAuthInterceptor();

  // Request interceptor - add auth header
  requestInterceptorId = axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (currentToken && config.headers) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle 401s
  responseInterceptorId = axios.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Token expired or invalid - logout user
        if (logoutCallback) {
          logoutCallback();
        }
      }
      return Promise.reject(error);
    }
  );
}

/**
 * Remove axios interceptors
 */
export function removeAuthInterceptor(): void {
  if (requestInterceptorId !== null) {
    axios.interceptors.request.eject(requestInterceptorId);
    requestInterceptorId = null;
  }
  
  if (responseInterceptorId !== null) {
    axios.interceptors.response.eject(responseInterceptorId);
    responseInterceptorId = null;
  }
  
  currentToken = null;
  logoutCallback = null;
}

/**
 * Get current auth token (for manual API calls)
 */
export function getAuthToken(): string | null {
  return currentToken;
}
