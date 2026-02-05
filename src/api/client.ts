import axios from 'axios';
import { config } from '../config';
import { AgentsResponse, AgentDetailResponse } from '../types/agent';

const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.requestTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getAgents(): Promise<AgentsResponse> {
  const response = await apiClient.get<AgentsResponse>('/agents');
  return response.data;
}

export async function getAgent(id: string): Promise<AgentDetailResponse> {
  const response = await apiClient.get<AgentDetailResponse>(`/agents/${id}`);
  return response.data;
}

export async function checkHealth(): Promise<{ status: string; gateway: string }> {
  const response = await apiClient.get('/health');
  return response.data;
}
