import apiClient from './client';

export interface ReservationResponseDto {
  reservationId: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  ratePerNight: number;
  checkInDate: string;
  checkOutDate: string;
  status: string;          // PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED
  specialRequests: string;
  createdAt: string;
  modifiedAt: string;
}

export interface ReservationRequestDto {
  guestId: string;
  roomId: string;
  checkInDate: string;    // ISO date: 2026-06-01
  checkOutDate: string;
  status?: string;
  specialRequests?: string;
}

export const reservationsApi = {
  getAll: () =>
    apiClient.get<ReservationResponseDto[]>('/v1/reservations').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ReservationResponseDto>(`/v1/reservations/${id}`).then((r) => r.data),

  getByGuest: (guestId: string) =>
    apiClient.get<ReservationResponseDto[]>(`/v1/reservations/guest/${guestId}`).then((r) => r.data),

  getByStatus: (status: string) =>
    apiClient.get<ReservationResponseDto[]>(`/v1/reservations/status/${status}`).then((r) => r.data),

  create: (payload: ReservationRequestDto) =>
    apiClient.post<ReservationResponseDto>('/v1/reservations', payload).then((r) => r.data),

  update: (id: string, payload: Partial<ReservationRequestDto>) =>
    apiClient.put<ReservationResponseDto>(`/v1/reservations/${id}`, payload).then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<ReservationResponseDto>(`/v1/reservations/${id}/status`, null, { params: { status } }).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/v1/reservations/${id}`),
};
