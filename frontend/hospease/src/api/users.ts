import apiClient from './client';

export interface UserResponseDTO {
  userId: string;
  name: string;
  role: string;        // backend role: ADMINISTRATOR, MANAGER, etc.
  email: string;
  phone: string;
  mfaEnabled: boolean;
  status: string;
}

export interface UserRequestDTO {
  name: string;
  role: string;
  email: string;
  phone: string;
  password?: string;
  mfaEnabled?: boolean;
  status?: string;
}

export interface AuditLogResponseDTO {
  auditId: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  detailsJson: string;
  timestamp: string;
}

export interface AuditLogRequestDTO {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  detailsJson: string;
}

export const usersApi = {
  getAll: () =>
    apiClient.get<UserResponseDTO[]>('/users').then(r => r.data),

  getById: (id: string) =>
    apiClient.get<UserResponseDTO>(`/users/${id}`).then(r => r.data),

  getByEmail: (email: string) =>
    apiClient.get<UserResponseDTO>(`/users/email/${email}`).then(r => r.data),

  getRoles: () =>
    apiClient.get<string[]>('/users/roles').then(r => r.data),

  create: (payload: UserRequestDTO) =>
    apiClient.post<UserResponseDTO>('/users', payload).then(r => r.data),

  update: (id: string, payload: UserRequestDTO) =>
    apiClient.put<UserResponseDTO>(`/users/${id}`, payload).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/users/${id}`),

  assignRole: (id: string, role: string) =>
    apiClient.post(`/users/${id}/assign-role`, null, { params: { role } }),

  enableMfa: (id: string) =>
    apiClient.post(`/users/${id}/enable-mfa`),

  disableMfa: (id: string) =>
    apiClient.post(`/users/${id}/disable-mfa`),
};

export const auditLogsApi = {
  getAll: () =>
    apiClient.get<AuditLogResponseDTO[]>('/audit-logs').then(r => r.data),

  getByUser: (userId: string) =>
    apiClient.get<AuditLogResponseDTO[]>(`/audit-logs/user/${userId}`).then(r => r.data),

  getByResource: (resourceType: string, resourceId: string) =>
    apiClient.get<AuditLogResponseDTO[]>(`/audit-logs/resource/${resourceType}/${resourceId}`).then(r => r.data),

  create: (payload: AuditLogRequestDTO) =>
    apiClient.post<AuditLogResponseDTO>('/audit-logs', payload).then(r => r.data),
};
