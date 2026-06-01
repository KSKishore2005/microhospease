 import apiClient from './client';
import type { UserRole } from '../types';


export const ROLE_MAP: Record<string, UserRole> = {
  ADMINISTRATOR: 'ADMIN',
  MANAGER: 'MANAGER',
  FRONT_DESK_STAFF: 'FRONT_DESK',
  HOUSEKEEPING_STAFF: 'HOUSEKEEPING',
  RESTAURANT_SERVICE_STAFF: 'SERVICE_STAFF',
  FINANCE_OFFICER: 'FINANCE',
  AUDITOR: 'REPORTING',
  GUEST: 'GUEST',
  STAFF: 'SERVICE_STAFF',
};

// Frontend UserRole → backend role string (for registration)
export const ROLE_MAP_REVERSE: Record<UserRole, string> = {
  ADMIN: 'ADMINISTRATOR',
  MANAGER: 'MANAGER',
  FRONT_DESK: 'FRONT_DESK_STAFF',
  HOUSEKEEPING: 'HOUSEKEEPING_STAFF',
  SERVICE_STAFF: 'RESTAURANT_SERVICE_STAFF',
  FINANCE: 'FINANCE_OFFICER',
  REPORTING: 'AUDITOR',
  GUEST: 'GUEST',
};


export interface AuthResponse {
  token: string;
  tokenType?: string;
  token_type?: string;
  userId?: string | number;
  user_id?: string | number;
  id?: string | number;
  name: string;
  email: string;
  role: string;
  expiresIn?: number;
  expires_in?: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  logout: () =>
    apiClient.post('/auth/logout').catch(() => {}),

  refreshToken: () =>
    apiClient.post<AuthResponse>('/auth/refresh-token').then((r) => r.data),

  validate: () =>
    apiClient.post<{ valid: boolean }>('/auth/validate').then((r) => r.data),

  register: (payload: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', payload).then((r) => r.data),
};
