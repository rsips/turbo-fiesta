/**
 * Audit Logs API Client
 * Fetches agent activity from /api/audit-logs
 */
import axios from 'axios';
import { config } from '../config';
import { AuditLogsResponse, AuditQueryParams } from '../types/audit';

const auditClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.requestTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Setup auth token from localStorage
auditClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('mission_control_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Fetch audit logs with filtering and pagination
 */
export async function getAuditLogs(params: AuditQueryParams = {}): Promise<AuditLogsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params.agent && params.agent !== 'all') queryParams.append('agent', params.agent);
  if (params.action && params.action !== 'all') queryParams.append('action', params.action);
  if (params.result && params.result !== 'all') queryParams.append('result', params.result);
  if (params.search) queryParams.append('search', params.search);
  if (params.from) queryParams.append('from', params.from);
  if (params.to) queryParams.append('to', params.to);

  const queryString = queryParams.toString();
  const url = `/audit-logs${queryString ? `?${queryString}` : ''}`;
  
  const response = await auditClient.get<AuditLogsResponse>(url);
  return response.data;
}

/**
 * Get unique agent names for filter dropdown
 */
export async function getAuditAgents(): Promise<{ agents: string[] }> {
  try {
    const response = await auditClient.get<{ agents: string[] }>('/audit-logs/agents');
    return response.data;
  } catch {
    // Fallback: return empty array if endpoint doesn't exist
    return { agents: [] };
  }
}
