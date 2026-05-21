import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RoomFlag = 'CLEAN' | 'READY';

interface RoomStatusState {
  roomFlags: Record<string, RoomFlag>;
  setFlag: (roomId: string, flag: RoomFlag) => void;
  clearFlag: (roomId: string) => void;
  getFlag: (roomId: string) => RoomFlag | undefined;
}

export const useRoomStatusStore = create<RoomStatusState>()(
  persist(
    (set, get) => ({
      roomFlags: {},

      setFlag: (roomId, flag) =>
        set((s) => ({ roomFlags: { ...s.roomFlags, [roomId]: flag } })),

      clearFlag: (roomId) =>
        set((s) => {
          const next = { ...s.roomFlags };
          delete next[roomId];
          return { roomFlags: next };
        }),

      getFlag: (roomId) => get().roomFlags[roomId],
    }),
    { name: 'hospease-room-flags' }
  )
);
