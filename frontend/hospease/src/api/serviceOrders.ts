import apiClient from './client';

export type ServiceType =
  | 'RESTAURANT'
  | 'LAUNDRY'
  | 'MAINTENANCE'
  | 'CONCIERGE'
  | 'SPA'
  | 'GYM'
  | 'ROOM_SERVICE'
  | 'HOUSEKEEPING'
  | 'TRANSPORT'
  | 'OTHER';

export type ServiceOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ServiceOrderResponseDto {
  orderId: string;
  guestId: string;
  reservationId: string;
  roomId: string;
  serviceType: ServiceType;
  description: string;
  price: number;
  status: ServiceOrderStatus;
  assignedToUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  guest?: { guestId: string; name: string; email: string };
  room?: { roomId: string; number: string; type: string };
}

export interface ServiceOrderRequestDto {
  guestId?: string | null;
  reservationId?: string | null;
  roomId?: string | null;
  serviceType: ServiceType;
  description: string;
  price: number;
}

export const serviceOrdersApi = {
  getAll: () =>
    apiClient.get<ServiceOrderResponseDto[]>('/service-orders').then(r => r.data),

  getById: (id: string) =>
    apiClient.get<ServiceOrderResponseDto>(`/service-orders/${id}`).then(r => r.data),

  getByGuest: (guestId: string) =>
    apiClient.get<ServiceOrderResponseDto[]>(`/service-orders/guest/${guestId}`).then(r => r.data),

  getByReservation: (reservationId: string) =>
    apiClient.get<ServiceOrderResponseDto[]>(`/service-orders/reservation/${reservationId}`).then(r => r.data),

  getByType: (type: ServiceType) =>
    apiClient.get<ServiceOrderResponseDto[]>(`/service-orders/type/${type}`).then(r => r.data),

  getByStatus: (status: ServiceOrderStatus) =>
    apiClient.get<ServiceOrderResponseDto[]>(`/service-orders/status/${status}`).then(r => r.data),

  create: (payload: ServiceOrderRequestDto) =>
    apiClient.post<ServiceOrderResponseDto>('/service-orders', payload).then(r => r.data),

  update: (id: string, payload: Partial<ServiceOrderRequestDto>) =>
    apiClient.put<ServiceOrderResponseDto>(`/service-orders/${id}`, payload).then(r => r.data),

  updateStatus: (id: string, status: ServiceOrderStatus) =>
    apiClient.patch<ServiceOrderResponseDto>(
      `/service-orders/${id}/status`, null, { params: { status } }
    ).then(r => r.data),

  getByAssignee: (userId: string) =>
    apiClient.get<ServiceOrderResponseDto[]>(`/service-orders/assignee/${userId}`).then(r => r.data),

  getQueue: () =>
    apiClient.get<ServiceOrderResponseDto[]>('/service-orders/queue').then(r => r.data),

  assign: (id: string, userId: string) =>
    apiClient.patch<ServiceOrderResponseDto>(
      `/service-orders/${id}/assign`, null, { params: { userId } }
    ).then(r => r.data),

  accept: (id: string, userId: string) =>
    apiClient.patch<ServiceOrderResponseDto>(
      `/service-orders/${id}/accept`, null, { params: { userId } }
    ).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/service-orders/${id}`),
};
