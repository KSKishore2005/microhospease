import apiClient from './client';

// ─── Reports ──────────────────────────────────────────────────────────────────
export interface ReportResponseDto {
  reportId: string;
  reportType: string;
  scope: string;           // OPERATIONAL, FINANCIAL, OCCUPANCY, REVENUE
  generatedAt: string;
  generatedByStaffId: string;
  contentSummary: string;
  reportUri?: string;
  staff?: { id: string; name: string };
}

export interface ReportRequestDto {
  reportType: string;
  scope: string;
  generatedByStaffId: string;
  contentSummary: string;
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────
export interface KPIResponseDto {
  kpiId: string;
  name: string;
  definition: string;
  target: number;
  currentValue: number;
  reportingPeriod: string;
}

export interface KPIRequestDto {
  name: string;
  definition: string;
  target: number;
  currentValue: number;
  reportingPeriod: string;
}

// ─── Audit Packages ───────────────────────────────────────────────────────────
export interface AuditPackageResponseDto {
  packageId: string;
  periodStart: string;
  periodEnd: string;
  contentsJson: string;
  packageUri?: string;
  generatedAt: string;
}

export interface AuditPackageRequestDto {
  periodStart: string;
  periodEnd: string;
  contentsJson: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────
export const reportsApi = {
  getAll: () =>
    apiClient.get<ReportResponseDto[]>('/reports').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ReportResponseDto>(`/reports/${id}`).then((r) => r.data),

  getByScope: (scope: string) =>
    apiClient.get<ReportResponseDto[]>(`/reports/scope/${scope}`).then((r) => r.data),

  getByStaff: (staffId: string) =>
    apiClient.get<ReportResponseDto[]>(`/reports/staff/${staffId}`).then((r) => r.data),

  create: (payload: ReportRequestDto) =>
    apiClient.post<ReportResponseDto>('/reports', payload).then((r) => r.data),

  update: (id: string, payload: Partial<ReportRequestDto>) =>
    apiClient.put<ReportResponseDto>(`/reports/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/reports/${id}`),
};

export const kpisApi = {
  getAll: () =>
    apiClient.get<KPIResponseDto[]>('/kpis').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<KPIResponseDto>(`/kpis/${id}`).then((r) => r.data),

  getByPeriod: (period: string) =>
    apiClient.get<KPIResponseDto[]>(`/kpis/period/${encodeURIComponent(period)}`).then((r) => r.data),

  create: (payload: KPIRequestDto) =>
    apiClient.post<KPIResponseDto>('/kpis', payload).then((r) => r.data),

  update: (id: string, payload: Partial<KPIRequestDto>) =>
    apiClient.put<KPIResponseDto>(`/kpis/${id}`, payload).then((r) => r.data),

  calculateOccupancy: (id: string) =>
    apiClient.post<KPIResponseDto>(`/kpis/${id}/calculate-occupancy`).then((r) => r.data),

  calculateRevenue: (id: string) =>
    apiClient.post<KPIResponseDto>(`/kpis/${id}/calculate-revenue`).then((r) => r.data),

  calculateCollectionRate: (id: string) =>
    apiClient.post<KPIResponseDto>(`/kpis/${id}/calculate-collection-rate`).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/kpis/${id}`),
};

export const auditPackagesApi = {
  getAll: () =>
    apiClient.get<AuditPackageResponseDto[]>('/audit-packages').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<AuditPackageResponseDto>(`/audit-packages/${id}`).then((r) => r.data),

  getByRange: (from: string, to: string) =>
    apiClient.get<AuditPackageResponseDto[]>('/audit-packages/range', { params: { from, to } }).then((r) => r.data),

  create: (payload: AuditPackageRequestDto) =>
    apiClient.post<AuditPackageResponseDto>('/audit-packages', payload).then((r) => r.data),

  update: (id: string, payload: Partial<AuditPackageRequestDto>) =>
    apiClient.put<AuditPackageResponseDto>(`/audit-packages/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/audit-packages/${id}`),
};
