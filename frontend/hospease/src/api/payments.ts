import apiClient from './client';

export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'WALLET';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'REFUNDED';

export interface PaymentResponseDto {
  paymentId: string;
  invoiceId: string;
  guestId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  status: PaymentStatus;
}

export interface PaymentRequestDto {
  amount: number;
  method: PaymentMethod;
}

export const paymentsApi = {
  getAll: () =>
    apiClient.get<PaymentResponseDto[]>('/payments').then(r => r.data),

  getById: (id: string) =>
    apiClient.get<PaymentResponseDto>(`/payments/${id}`).then(r => r.data),

  getByInvoice: (invoiceId: string) =>
    apiClient.get<PaymentResponseDto[]>(`/payments/invoice/${invoiceId}`).then(r => r.data),

  getByGuest: (guestId: string) =>
    apiClient.get<PaymentResponseDto[]>(`/payments/guest/${guestId}`).then(r => r.data),

  create: (invoiceId: string, guestId: string, payload: PaymentRequestDto) =>
    apiClient.post<PaymentResponseDto>('/payments', payload, {
      params: { invoiceId, guestId },
    }).then(r => r.data),

  update: (id: string, payload: Partial<PaymentRequestDto>) =>
    apiClient.put<PaymentResponseDto>(`/payments/${id}`, payload).then(r => r.data),

  refund: (id: string) =>
    apiClient.patch<PaymentResponseDto>(`/payments/${id}/refund`).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/payments/${id}`),
};
