import apiClient from './client';

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceResponseDto {
  invoiceId: string;
  guestId: string;
  reservationId: string;
  lineItemsJson: string;   // JSON string: [{description, quantity, unitPrice, total}]
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  issuedAt: string;
  dueDate: string;
  status: InvoiceStatus;
  invoiceUri?: string;
  guest?: { guestId: string; name: string; email: string };
}

export interface InvoiceRequestDto {
  guestId: string;
  reservationId: string;
  lineItemsJson: string;
  totalAmount: number;
  currency?: string;
  dueDate: string;
  invoiceUri?: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export function parseLineItems(json: string): LineItem[] {
  try { return JSON.parse(json) ?? []; } catch { return []; }
}

export const invoicesApi = {
  getAll: () =>
    apiClient.get<InvoiceResponseDto[]>('/invoices').then(r => r.data),

  getById: (id: string) =>
    apiClient.get<InvoiceResponseDto>(`/invoices/${id}`).then(r => r.data),

  getByGuest: (guestId: string) =>
    apiClient.get<InvoiceResponseDto[]>(`/invoices/guest/${guestId}`).then(r => r.data),

  getByReservation: (reservationId: string) =>
    apiClient.get<InvoiceResponseDto>(`/invoices/reservation/${reservationId}`).then(r => r.data),

  getByStatus: (status: InvoiceStatus) =>
    apiClient.get<InvoiceResponseDto[]>(`/invoices/status/${status}`).then(r => r.data),

  create: (payload: InvoiceRequestDto) =>
    apiClient.post<InvoiceResponseDto>('/invoices', payload).then(r => r.data),

  generateForReservation: (reservationId: string) =>
    apiClient.post<InvoiceResponseDto>(`/invoices/generate/${reservationId}`).then(r => r.data),

  update: (id: string, payload: Partial<InvoiceRequestDto>) =>
    apiClient.put<InvoiceResponseDto>(`/invoices/${id}`, payload).then(r => r.data),

  markPaid: (id: string) =>
    apiClient.patch<InvoiceResponseDto>(`/invoices/${id}/pay`).then(r => r.data),

  markOverdue: (id: string) =>
    apiClient.patch<InvoiceResponseDto>(`/invoices/${id}/overdue`).then(r => r.data),

  cancel: (id: string) =>
    apiClient.patch<InvoiceResponseDto>(`/invoices/${id}/cancel`).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/invoices/${id}`),
};
