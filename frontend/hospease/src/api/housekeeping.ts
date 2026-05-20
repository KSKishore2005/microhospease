import apiClient from './client';

export interface HousekeepingTaskResponseDto {
  taskId: string;
  roomId: string;
  assignedToUserId: string;
  scheduledAt: string;
  completedAt: string | null;
  status: string;   // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
}

export interface HousekeepingTaskRequestDto {
  roomId: string;
  assignedToUserId: string;
  scheduledAt: string;
  completedAt?: string;
  status?: string;
}

export const housekeepingApi = {
  getAll: () =>
    apiClient.get<HousekeepingTaskResponseDto[]>('/housekeeping-tasks').then(r => r.data),

  getById: (id: string) =>
    apiClient.get<HousekeepingTaskResponseDto>(`/housekeeping-tasks/${id}`).then(r => r.data),

  getByRoom: (roomId: string) =>
    apiClient.get<HousekeepingTaskResponseDto[]>(`/housekeeping-tasks/room/${roomId}`).then(r => r.data),

  getByAssignee: (userId: string) =>
    apiClient.get<HousekeepingTaskResponseDto[]>(`/housekeeping-tasks/assignee/${userId}`).then(r => r.data),

  getByStatus: (status: string) =>
    apiClient.get<HousekeepingTaskResponseDto[]>(`/housekeeping-tasks/status/${status}`).then(r => r.data),

  create: (payload: HousekeepingTaskRequestDto) =>
    apiClient.post<HousekeepingTaskResponseDto>('/housekeeping-tasks', payload).then(r => r.data),

  update: (id: string, payload: Partial<HousekeepingTaskRequestDto>) =>
    apiClient.put<HousekeepingTaskResponseDto>(`/housekeeping-tasks/${id}`, payload).then(r => r.data),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<HousekeepingTaskResponseDto>(
      `/housekeeping-tasks/${id}/status`, null, { params: { status } }
    ).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/housekeeping-tasks/${id}`),
};
