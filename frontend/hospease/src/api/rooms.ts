import apiClient from './client';

export interface RoomResponseDto {
  roomId: string;
  number: string;
  type: string;           // SINGLE, DOUBLE, SUITE, DELUXE
  capacity: number;
  amenitiesJson: string;  // JSON array string
  status: string;         // AVAILABLE, OCCUPIED, MAINTENANCE, CLEANING
  ratePerNight: number;
  createdAt: string;
}

export interface RoomRequestDto {
  number: string;
  type: string;
  capacity: number;
  amenitiesJson?: string;
  status?: string;
  ratePerNight: number;
}

export const roomsApi = {
  getAll: () =>
    apiClient.get<RoomResponseDto[]>('/rooms').then(r => r.data),

  getById: (id: string) =>
    apiClient.get<RoomResponseDto>(`/rooms/${id}`).then(r => r.data),

  getAvailable: () =>
    apiClient.get<RoomResponseDto[]>('/rooms/available').then(r => r.data),

  getByType: (type: string) =>
    apiClient.get<RoomResponseDto[]>(`/rooms/type/${type}`).then(r => r.data),

  getAvailableByType: (type: string) =>
    apiClient.get<RoomResponseDto[]>(`/rooms/available/type/${type}`).then(r => r.data),

  checkAvailability: (id: string, from: string, to: string) =>
    apiClient.get<boolean>(`/rooms/${id}/availability`, { params: { from, to } }).then(r => r.data),

  create: (payload: RoomRequestDto) =>
    apiClient.post<RoomResponseDto>('/rooms', payload).then(r => r.data),

  update: (id: string, payload: Partial<RoomRequestDto>) =>
    apiClient.put<RoomResponseDto>(`/rooms/${id}`, payload).then(r => r.data),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<RoomResponseDto>(`/rooms/${id}/status`, null, { params: { status } }).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/rooms/${id}`),
};
