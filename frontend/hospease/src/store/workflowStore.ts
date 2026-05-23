import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CustomStatus =
  | 'FORWARDED_TO_MANAGER'
  | 'STAFF_ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'STAFF_COMPLETED'
  | 'MANAGER_VERIFIED';

interface WorkflowEntry {
  status: CustomStatus;
  assignedUserId?: string;
  assignedUserName?: string;
  updatedAt: string;
}

interface WorkflowState {
  customStatuses: Record<string, WorkflowEntry>;
  setStatus: (orderId: string, status: CustomStatus, meta?: { assignedUserId?: string; assignedUserName?: string }) => void;
  clearStatus: (orderId: string) => void;
  getStatus: (orderId: string) => WorkflowEntry | undefined;
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      customStatuses: {},

      setStatus: (orderId, status, meta = {}) =>
        set((s) => ({
          customStatuses: {
            ...s.customStatuses,
            [orderId]: { status, ...meta, updatedAt: new Date().toISOString() },
          },
        })),

      clearStatus: (orderId) =>
        set((s) => {
          const next = { ...s.customStatuses };
          delete next[orderId];
          return { customStatuses: next };
        }),

      getStatus: (orderId) => get().customStatuses[orderId],
    }),
    { name: 'hospease-workflow' }
  )
);
