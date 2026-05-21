import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  dot: string;   // tailwind bg color class e.g. 'bg-emerald-500'
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  dismissedIds: string[];
  addNotification: (n: AppNotification) => void;
  markAllRead: () => void;
  getUnread: () => AppNotification[];
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      dismissedIds: [],

      addNotification: (n) =>
        set((s) => {
          if (s.notifications.find((x) => x.id === n.id)) return s;
          if (s.dismissedIds.includes(n.id)) return s;
          return { notifications: [n, ...s.notifications].slice(0, 50) };
        }),

      markAllRead: () =>
        set((s) => ({
          dismissedIds: [...new Set([...s.dismissedIds, ...s.notifications.map((n) => n.id)])],
          notifications: [],
        })),

      getUnread: () => {
        const { notifications, dismissedIds } = get();
        return notifications.filter((n) => !dismissedIds.includes(n.id));
      },
    }),
    {
      name: 'hospease-notifications',
      partialize: (s) => ({ dismissedIds: s.dismissedIds }),
    }
  )
);
