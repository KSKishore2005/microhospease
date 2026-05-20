import apiClient from './client';

export interface GuestResponseDto {
  guestId: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  loyaltyTier: string;   // BRONZE, SILVER, GOLD, PLATINUM
  loyaltyPoints?: number;
  status: string;        // ACTIVE, INACTIVE, BLACKLISTED
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuestRequestDto {
  name: string;
  email: string;
  phone?: string;   // optional – auto-created profiles may omit it
  dob?: string;
  loyaltyTier?: string;
  status?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export const guestsApi = {
  getAll: () =>
    apiClient.get<GuestResponseDto[]>('/v1/guests').then(r => r.data),

  getById: (id: string) =>
    apiClient.get<GuestResponseDto>(`/v1/guests/${id}`).then(r => r.data),

  getByEmail: (email: string) =>
    apiClient.get<GuestResponseDto>(`/v1/guests/email/${encodeURIComponent(email)}`).then(r => r.data),

  getByLoyaltyTier: (tier: string) =>
    apiClient.get<GuestResponseDto[]>(`/v1/guests/loyalty/${tier}`).then(r => r.data),

  getByStatus: (status: string) =>
    apiClient.get<GuestResponseDto[]>(`/v1/guests/status/${status}`).then(r => r.data),

  create: (payload: GuestRequestDto) =>
    apiClient.post<GuestResponseDto>('/v1/guests', payload).then(r => r.data),

  /**
   * Idempotent "ensure my profile exists" — returns the existing guest by
   * email (case-insensitive) or creates a minimal one. Never errors on
   * "already exists" races. Prefer this over getByEmail + create chains.
   */
  upsert: (payload: GuestRequestDto) =>
    apiClient.post<GuestResponseDto>('/v1/guests/upsert', payload).then(r => r.data),

  update: (id: string, payload: GuestRequestDto) =>
    apiClient.put<GuestResponseDto>(`/v1/guests/${id}`, payload).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/v1/guests/${id}`),
};
