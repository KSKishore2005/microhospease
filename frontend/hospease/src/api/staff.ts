import apiClient from './client';

// Staff and Shift entities are returned directly from room-housekeeping-service
export interface StaffEntity {
  id: string;
  name: string;
  role: string;
  department: string;
  phone?: string;
  email?: string;
  userId?: string;
  hireDate?: string;
  status?: string;
}

export interface ShiftEntity {
  id: string;
  staffId: string;
  startTime: string;
  endTime: string;
  shiftType?: string;   // MORNING, AFTERNOON, NIGHT
  assignedById?: string;
  notes?: string;
}

export interface StaffRequestPayload {
  name: string;
  role: string;
  department: string;
  phone?: string;
  email?: string;
  hireDate?: string;
  status?: string;
}

export interface ShiftRequestPayload {
  staffId: string;
  startTime: string;
  endTime: string;
  shiftType?: string;
  assignedById?: string;
  notes?: string;
}

export const staffApi = {
  getAll: () =>
    apiClient.get<StaffEntity[]>('/staff').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<StaffEntity>(`/staff/${id}`).then((r) => r.data),

  getByDepartment: (department: string) =>
    apiClient.get<StaffEntity[]>(`/staff/department/${department}`).then((r) => r.data),

  create: (payload: StaffRequestPayload, userId?: string) =>
    apiClient.post<StaffEntity>('/staff', payload, { params: userId ? { userId } : {} }).then((r) => r.data),

  update: (id: string, payload: Partial<StaffRequestPayload>) =>
    apiClient.put<StaffEntity>(`/staff/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/staff/${id}`),
};

export const shiftsApi = {
  getAll: () =>
    apiClient.get<ShiftEntity[]>('/shifts').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ShiftEntity>(`/shifts/${id}`).then((r) => r.data),

  getByStaff: (staffId: string) =>
    apiClient.get<ShiftEntity[]>(`/shifts/staff/${staffId}`).then((r) => r.data),

  create: (payload: ShiftRequestPayload, assignedById?: string) =>
    apiClient.post<ShiftEntity>('/shifts', payload, { params: assignedById ? { staffId: payload.staffId, assignedById } : { staffId: payload.staffId } }).then((r) => r.data),

  update: (id: string, payload: Partial<ShiftRequestPayload>) =>
    apiClient.put<ShiftEntity>(`/shifts/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/shifts/${id}`),
};
